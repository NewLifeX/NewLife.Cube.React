#!/usr/bin/env node
/**
 * 在 nuget.org 创建 Trusted Publishing（OIDC）策略，供 publish.yml / publish-beta.yml 免密钥发布。
 *
 * 运行前：
 *   1. cd NewLife.Cube.React/web && pnpm install
 *   2. pnpm exec playwright install chromium（已装过可跳过）
 *   3. 准备手动登录 nuget.org，账号必须是 workflows 里 NuGet/login 的 user（BigStone），
 *      且该账号能代表包所有者 NewLife 发布
 *
 * 用法：
 *   node scripts/nuget-trusted-publishing.mjs            # 检查并补齐缺失策略
 *   node scripts/nuget-trusted-publishing.mjs --dry-run  # 只检查，不创建
 *
 * 说明：nuget.org 未公开策略管理 API，脚本在已登录页面内调用网页同款接口
 *      /account/GenerateTrustedPublisherPolicy（自动带上 antiforgery token），
 *      等价于在 https://www.nuget.org/account/trustedpublishing 点 Create。
 *      登录态保存在用户目录，下次运行无需重新登录。
 */
import { chromium } from '@playwright/test';
import os from 'node:os';
import path from 'node:path';

const CONFIG = {
  // 与 .github/workflows/*.yml 中 NuGet/login 的 user 一致；策略创建者必须是这个账号
  loginUser: 'BigStone',
  // nuget.org 上的包所有者（NewLife.Cube.React 的 owner）
  packageOwner: 'NewLife',
  github: {
    owner: 'NewLifeX',
    repository: 'NewLife.Cube.React',
  },
  packageSubjects: ['NewLife.Cube.React'],
  // package:push = 可发布新包和新版本
  scopes: ['package:push'],
  // 每条 workflow 需要一条独立策略（策略按 workflow 文件名匹配）
  workflows: [
    { file: 'publish.yml', name: '正式版（tag 触发）' },
    { file: 'publish-beta.yml', name: 'beta（master 推送触发）' },
  ],
  // 两条 workflow 都没有使用 environment，这里必须留空
  environment: '',
};

const BASE_URL = (process.env.NUGET_TRUSTED_PUBLISHING_BASE_URL || 'https://www.nuget.org').replace(/\/+$/, '');
const TRUSTED_PUBLISHING_URL = `${BASE_URL}/account/trustedpublishing`;
const GENERATE_URL = '/account/GenerateTrustedPublisherPolicy';
const EDIT_URL = '/account/EditTrustedPublisherPolicy';
const PROFILE_DIR = path.join(os.homedir(), '.nuget-trusted-publishing-profile');
const HEADLESS = process.env.NUGET_TRUSTED_PUBLISHING_HEADLESS === '1';
const LOGIN_TIMEOUT_MS = 15 * 60 * 1000;

const dryRun = process.argv.includes('--dry-run');

const sameText = (a, b) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();

function printHeader() {
  console.log('=== nuget.org Trusted Publishing（OIDC）策略设置 ===');
  console.log(`包所有者：${CONFIG.packageOwner}`);
  console.log(`GitHub：${CONFIG.github.owner}/${CONFIG.github.repository}`);
  console.log(`工作流：${CONFIG.workflows.map((w) => w.file).join('、')}`);
  console.log(`模式：${dryRun ? 'dry-run（只检查，不创建）' : '检查并创建缺失策略'}`);
  console.log('');
}

function printLoginPrompt() {
  console.log('');
  console.log('────────────────────────────────────────────────────────────');
  console.log(`请在打开的浏览器中登录 nuget.org，账号：${CONFIG.loginUser}`);
  console.log(`登录后回到：${TRUSTED_PUBLISHING_URL}`);
  console.log('需要邮箱验证码 / 2FA 时请手动完成，脚本会一直等待。');
  console.log('────────────────────────────────────────────────────────────');
  console.log('');
}

async function isPageReady(page) {
  return page
    .evaluate(() => Array.isArray(window.initialData?.Policies) && Array.isArray(window.initialData?.PackageOwners))
    .catch(() => false);
}

async function waitForPageReady(page, timeoutMs = LOGIN_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  let prompted = false;
  let lastRedirectAt = 0;

  while (Date.now() < deadline) {
    if (await isPageReady(page)) return;

    if (!prompted) {
      printLoginPrompt();
      prompted = true;
    }

    const url = page.url();
    const onAuthPage = /signin|login|forgotpassword|confirm|2fa/i.test(url);
    if (!HEADLESS && url.startsWith(BASE_URL) && !onAuthPage && !url.includes('/account/trustedpublishing') && Date.now() - lastRedirectAt > 5000) {
      lastRedirectAt = Date.now();
      await page.goto(TRUSTED_PUBLISHING_URL, { waitUntil: 'domcontentloaded' }).catch(() => {});
    }

    await page.waitForTimeout(1000);
  }

  throw new Error('等待登录超时（15 分钟），请重新运行脚本。');
}

async function readState(page) {
  return page.evaluate(() => {
    const normalize = (p) => ({
      key: p.Key ?? p.key ?? 0,
      name: p.PolicyName ?? p.policyName ?? '',
      owner: p.Owner ?? p.owner ?? '',
      publisher: p.PublisherName ?? p.publisherName ?? '',
      scopes: p.PolicyScopes ?? p.policyScopes ?? [],
      subjects: p.PolicySubjects ?? p.policySubjects ?? [],
      details: p.PolicyDetails ?? p.policyDetails ?? {},
    });
    const data = window.initialData ?? {};
    return {
      owners: (data.PackageOwners ?? []).map((o) => o.Owner ?? o.owner ?? '').filter(Boolean),
      policies: (data.Policies ?? []).map(normalize),
    };
  });
}

function assertOwnerAvailable(state) {
  if (!state.owners.some((owner) => sameText(owner, CONFIG.packageOwner))) {
    throw new Error(
      `当前登录账号无法管理包所有者“${CONFIG.packageOwner}”（可见所有者：${state.owners.join('、') || '无'}）。\n` +
        `请确认使用 ${CONFIG.loginUser} 登录，且该账号是 ${CONFIG.packageOwner} 的成员。`
    );
  }
}

function findByWorkflow(policies, workflowFile) {
  return policies.find(
    (p) =>
      sameText(p.publisher, 'GitHubActions') &&
      sameText(p.owner, CONFIG.packageOwner) &&
      sameText(p.details?.RepositoryOwner, CONFIG.github.owner) &&
      sameText(p.details?.Repository, CONFIG.github.repository) &&
      sameText(p.details?.WorkflowFile, workflowFile) &&
      sameText(p.details?.Environment ?? '', CONFIG.environment)
  );
}

function describePolicy(policy) {
  const details = policy.details ?? {};
  const target =
    policy.publisher === 'GitLab'
      ? `${details.NamespacePath}/${details.ProjectPath}@${details.Ref || '*'}`
      : `${details.RepositoryOwner}/${details.Repository}@${details.WorkflowFile}` +
        `${details.Environment ? ` [${details.Environment}]` : ''}`;
  const permanent = details.IsPermanentlyEnabled ?? details.isPermanentlyEnabled;
  return (
    `#${policy.key} ${policy.name} | ${policy.publisher} | ${target} | ` +
    `scopes=${policy.scopes.join(',')} | subjects=${policy.subjects.join(',')} | ` +
    `${permanent ? '永久生效' : '待首次使用激活'}`
  );
}

async function lookupGitHubIds() {
  const url = `https://api.github.com/repos/${CONFIG.github.owner}/${CONFIG.github.repository}`;
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': `${CONFIG.github.repository}-trusted-publishing`,
      },
    });
    if (!response.ok) {
      console.warn(`⚠ 查询 GitHub 仓库 ID 失败（HTTP ${response.status}），将创建“待首次使用激活”的策略。`);
      return null;
    }
    const data = await response.json();
    const ownerId = data?.owner?.id ? String(data.owner.id) : '';
    const repositoryId = data?.id ? String(data.id) : '';
    return ownerId && repositoryId ? { ownerId, repositoryId } : null;
  } catch (error) {
    console.warn(`⚠ 查询 GitHub 仓库 ID 异常：${error.message}，将创建“待首次使用激活”的策略。`);
    return null;
  }
}

async function postForm(page, url, fields) {
  const result = await page.evaluate(
    async ({ url, fields }) => {
      const token = document.querySelector('#AntiForgeryForm input[name="__RequestVerificationToken"]')?.value;
      if (!token) return { status: -1, text: '页面缺少 antiforgery token，请刷新页面后重试。' };

      const body = new URLSearchParams();
      for (const [key, value] of Object.entries(fields)) {
        if (Array.isArray(value)) {
          for (const item of value) body.append(key, item);
        } else {
          body.append(key, value ?? '');
        }
      }
      body.append('__RequestVerificationToken', token);

      const response = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: body.toString(),
      });

      return { status: response.status, text: await response.text() };
    },
    { url, fields }
  );

  if (result.status !== 200) {
    throw new Error(`请求 ${url} 失败（HTTP ${result.status}）：${result.text}`);
  }

  let payload;
  try {
    payload = JSON.parse(result.text);
  } catch {
    payload = result.text;
  }
  if (typeof payload !== 'object' || payload === null) {
    throw new Error(`请求 ${url} 失败：${String(payload)}`);
  }
  return payload;
}

function buildCriteria(workflowFile, ids) {
  const criteria = {
    Name: 'GitHubActions',
    RepositoryOwner: CONFIG.github.owner,
    Repository: CONFIG.github.repository,
    WorkflowFile: workflowFile,
    Environment: CONFIG.environment,
  };
  if (ids) {
    criteria.RepositoryOwnerId = ids.ownerId;
    criteria.RepositoryId = ids.repositoryId;
  }
  return criteria;
}

async function createPolicy(page, workflowFile, ids) {
  return postForm(page, GENERATE_URL, {
    policyName: `${CONFIG.github.repository} ${workflowFile}`,
    owner: CONFIG.packageOwner,
    criteria: JSON.stringify(buildCriteria(workflowFile, ids)),
    publisherType: 'GitHubActions',
    policyScopes: CONFIG.scopes,
    policySubjects: CONFIG.packageSubjects,
  });
}

async function upgradePolicy(page, policy, workflowFile, ids) {
  return postForm(page, EDIT_URL, {
    federatedCredentialKey: String(policy.key),
    policyName: policy.name || `${CONFIG.github.repository} ${workflowFile}`,
    criteria: JSON.stringify(buildCriteria(workflowFile, ids)),
    policyScopes: policy.scopes.length > 0 ? policy.scopes : CONFIG.scopes,
    policySubjects: policy.subjects.length > 0 ? policy.subjects : CONFIG.packageSubjects,
  });
}

async function launchBrowser() {
  const options = { headless: HEADLESS, viewport: { width: 1280, height: 960 } };
  try {
    return await chromium.launchPersistentContext(PROFILE_DIR, options);
  } catch (error) {
    if (!/Executable doesn't exist|playwright install/i.test(error.message)) throw error;
    console.warn('⚠ 未找到 Playwright Chromium，改用系统 Edge/Chrome。');
    for (const channel of ['msedge', 'chrome']) {
      try {
        return await chromium.launchPersistentContext(PROFILE_DIR, { ...options, channel });
      } catch {
        // 继续尝试下一个
      }
    }
    throw new Error('没有可用浏览器：请先执行 pnpm exec playwright install chromium，或安装 Edge/Chrome。');
  }
}

async function main(ids) {
  printHeader();

  const context = await launchBrowser();

  try {
    const page = context.pages()[0] ?? (await context.newPage());
    if (!page.url().includes('/account/trustedpublishing')) {
      await page.goto(TRUSTED_PUBLISHING_URL, { waitUntil: 'domcontentloaded' });
    }
    await waitForPageReady(page);

    const before = await readState(page);
    assertOwnerAvailable(before);

    if (before.policies.length > 0) {
      console.log('现有策略：');
      for (const policy of before.policies) console.log(`  ${describePolicy(policy)}`);
      console.log('');
    }

    const missing = [];
    const temporary = [];

    for (const workflow of CONFIG.workflows) {
      const existing = findByWorkflow(before.policies, workflow.file);
      if (!existing) {
        missing.push(workflow);
        continue;
      }
      const details = existing.details ?? {};
      if (details.IsPermanentlyEnabled ?? details.isPermanentlyEnabled) {
        console.log(`✓ 已存在：${workflow.file}（${workflow.name}）`);
      } else {
        temporary.push({ workflow, policy: existing });
      }
    }

    if (missing.length === 0 && temporary.length === 0) {
      console.log('\n✓ 两条工作流的 Trusted Publishing 策略都已存在，无需创建。');
      return;
    }

    const errors = [];

    for (const { workflow, policy } of temporary) {
      if (dryRun) {
        console.log(`⚠ 已存在但未永久激活：${workflow.file}（缺少 GitHub 仓库 ID）`);
      } else if (ids) {
        console.log(`→ 补全 GitHub 仓库 ID，使策略永久生效：${workflow.file}`);
        try {
          await upgradePolicy(page, policy, workflow.file, ids);
          console.log('✓ 已升级为永久策略');
        } catch (error) {
          errors.push(`${workflow.file}（升级）：${error.message}`);
          console.error(`✗ 升级失败：${error.message}`);
        }
      } else {
        console.log(`⚠ 已存在但未永久激活：${workflow.file}（未取到 GitHub 仓库 ID，首次发布成功后自动激活）`);
      }
    }

    for (const workflow of missing) {
      if (dryRun) {
        console.log(`✗ 缺少：${workflow.file}（${workflow.name}）`);
        continue;
      }

      console.log(`→ 创建：${workflow.file}（${workflow.name}）`);
      try {
        const created = await createPolicy(page, workflow.file, ids);
        console.log(`✓ 已创建：${created.PolicyName ?? created.policyName ?? workflow.file}`);
      } catch (error) {
        errors.push(`${workflow.file}（创建）：${error.message}`);
        console.error(`✗ 创建失败：${error.message}`);
      }
    }

    if (dryRun) {
      console.log('\ndry-run 结束：未做任何修改。去掉 --dry-run 可创建缺失策略。');
      return;
    }

    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForPageReady(page, 60_000);
    const after = await readState(page);
    for (const workflow of CONFIG.workflows) {
      const policy = findByWorkflow(after.policies, workflow.file);
      if (!policy) {
        errors.push(`${workflow.file}：刷新后未找到策略`);
        continue;
      }
      const details = policy.details ?? {};
      if (!(details.IsPermanentlyEnabled ?? details.isPermanentlyEnabled)) {
        console.warn(`⚠ ${workflow.file} 尚未永久激活，首次成功发布后会自动激活。`);
      }
    }

    if (errors.length > 0) throw new Error(`部分操作未完成：\n- ${errors.join('\n- ')}`);

    console.log('\n✓ 全部策略已就绪：publish / publish-beta 现在可以用 OIDC 发布 NuGet 包。');
  } finally {
    await context.close().catch(() => {});
  }
}

let exitCode = 0;

try {
  const ids = dryRun ? null : await lookupGitHubIds();
  await main(ids);
} catch (error) {
  console.error(`\n✗ ${error.message}`);
  exitCode = 1;
}

process.exitCode = exitCode;
