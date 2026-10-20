/**
 * 服务器信息页（对齐 MVC 版 Areas/Admin/Views/Index/Main.cshtml）
 *
 * 工作台 CPU 使用率卡片跳转到 /Admin/Index/Main。该控制器菜单隐藏（[Menu(0,false)]），
 * 后端 API 版 IndexController.Main() 返回服务器信息 JSON（BuildServerInfo），
 * 本页以两列表格展示，供管理员查看应用/系统/网络/运行状态。
 */
import { useEffect, useState } from 'react';
import { Card, Descriptions, Spin } from 'antd';
import { api } from '@/api';
import { t } from '@/i18n';

/** 服务器信息（对应后端 BuildServerInfo 返回字段） */
export interface ServerInfo {
  /** 应用系统（当前 URL） */
  system?: string;
  /** 内容根目录 */
  path?: string;
  /** 主机头 */
  host?: string;
  /** 本地地址 */
  local?: string;
  /** 远程地址 */
  remote?: string;
  /** 应用程序（进程名） */
  application?: string;
  /** 应用命令行 */
  applicationTitle?: string;
  /** .Net 框架版本 */
  version?: string;
  /** 操作系统名称 */
  os?: string;
  /** 操作系统版本 */
  osVersion?: string;
  /** 机器标识 */
  machineId?: string;
  /** 机器型号 */
  machineProduct?: string;
  /** CPU 信息 */
  cpu?: string;
  /** 运行时间 */
  openTime?: string;
  /** 服务器时间 */
  serverTime?: string;
  /** 内存信息 */
  memory?: string;
  /** 进程时间 */
  processTime?: string;
  /** GC 设置 */
  gc?: string;
}

/** 组装两列表格行：返回 [label, value, title?] */
function toRows(info: ServerInfo): Array<[string, string, string?]> {
  const rows: Array<[string, string, string?]> = [
    [t('应用系统'), info.system || '', ''],
    [t('目录'), info.path || '', ''],
  ];
  // 域名地址：主机，本地 [远程]
  const host = info.host || '';
  const local = info.local || '';
  const remote = info.remote ? `[${info.remote}]` : '';
  rows.push([t('域名地址'), [host, local, remote].filter(Boolean).join('，'), '']);
  rows.push([t('应用程序'), info.application || '', info.applicationTitle]);
  rows.push([t('.Net 版本'), info.version || '', '']);
  rows.push([t('操作系统'), [info.os, info.osVersion].filter(Boolean).join(' '), info.machineId]);
  rows.push(['CPU', info.cpu || '', '']);
  rows.push([t('内存'), info.memory || '', '']);
  rows.push([t('运行时间'), info.openTime || '', '']);
  rows.push([t('服务器时间'), info.serverTime || '', '']);
  rows.push([t('GC 设置'), info.gc || '', '']);
  rows.push([t('进程时间'), info.processTime || '', '']);
  if (info.machineProduct) rows.push([t('机器型号'), info.machineProduct, '']);
  return rows;
}

export default function ServerInfoPage() {
  const [info, setInfo] = useState<ServerInfo | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.client
      .get('/Admin/Index/Main')
      .then((res) => {
        if (cancelled) return;
        const body = res.data as { data?: ServerInfo } | ServerInfo;
        const data = (body as { data?: ServerInfo })?.data ?? (body as ServerInfo);
        setInfo(data ?? null);
      })
      .catch(() => {
        if (!cancelled) setError(t('服务器信息获取失败'));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <Card size="small">
        <div style={{ color: 'var(--cube-danger)', padding: 24, textAlign: 'center' }}>{error}</div>
      </Card>
    );
  }

  if (!info) {
    return (
      <Card size="small" styles={{ body: { display: 'flex', justifyContent: 'center', padding: 48 } }}>
        <Spin />
      </Card>
    );
  }

  const rows = toRows(info);

  return (
    <Card size="small">
      <Descriptions
        bordered
        size="small"
        column={2}
        title={t('服务器信息')}
        className="cube-server-info"
        items={rows.map(([label, value, title]) => ({
          key: label,
          label,
          children: <span title={title}>{value}</span>,
        }))}
      />
    </Card>
  );
}
