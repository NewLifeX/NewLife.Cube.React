/**
 * 角色权限配置弹窗（对齐 MVC 角色编辑页的「授权」树形表格）
 *
 * 后端 /Admin/Role/PermissionTree 返回菜单树（每项含可用权限位 flags 与当前角色已授权位 granted），
 * 前端树形 Table 逐行配置操作权限（对齐 MVC 授权表格：叶子行渲染全部权限位复选框，父级行提供
 * 只读/全部/无权限级联快捷），默认仅展开一级菜单，避免表单拉长。
 * 保存时收集为 "id#flag,id#flag" 权限字符串（与后端 Role.LoadPermission 解析格式一致）提交保存。
 */
import { useEffect, useMemo, useState } from 'react';
import { App, Checkbox, Modal, Space, Table, Typography } from 'antd';
import { api } from '@/api';
import {
  buildQuickGranted,
  collectSubtreeIds,
  serializePermissions,
  type PermissionNode,
  type QuickMode,
} from '@/views/list/utils/permission';

interface PermissionDialogProps {
  open: boolean;
  roleId?: number;
  roleName?: string;
  onClose: () => void;
  onSaved?: () => void;
}

export default function PermissionDialog({ open, roleId, roleName, onClose, onSaved }: PermissionDialogProps) {
  const { message } = App.useApp();
  const [tree, setTree] = useState<PermissionNode[]>([]);
  const [grantedMap, setGrantedMap] = useState<Record<number, number>>({});
  /** 展开键（受控）。默认折叠：仅显示一级菜单，点击展开箭头查看子级 */
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 打开时加载权限树
  useEffect(() => {
    if (!open || !roleId) return;
    setLoading(true);
    api.client
      .get('/Admin/Role/PermissionTree', { params: { roleId } })
      .then((res) => {
        // api.client 为原始 axios（不解包），后端返回 { code, data: { role, tree } }
        const body = res.data as { data?: { tree?: PermissionNode[] } };
        const data = body?.data?.tree ?? [];
        setTree(data);
        // 扁平化收集已授权位；展开键保持空（默认折叠仅显示一级菜单）
        const map: Record<number, number> = {};
        const walk = (nodes: PermissionNode[]) => {
          for (const n of nodes) {
            if (n.granted) map[n.id] = n.granted;
            if (n.children?.length) walk(n.children);
          }
        };
        walk(data);
        setGrantedMap(map);
        setExpandedKeys([]);
      })
      .catch(() => message.error('加载权限树失败'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, roleId]);

  /** 勾选/取消单个权限位 */
  const toggle = (id: number, flag: number) => {
    setGrantedMap((prev) => {
      const cur = prev[id] ?? 0;
      const next = cur & flag ? cur & ~flag : cur | flag;
      const copy = { ...prev };
      if (next) copy[id] = next;
      else delete copy[id];
      return copy;
    });
  };

  /** 快捷设置：只读=查看(1)、全部=全部权限位(0xFFFFFFFF)、无权限=0。父级级联到当前+所有子孙，叶子仅自身 */
  const handleQuick = (row: PermissionNode, mode: QuickMode) => {
    const ids = collectSubtreeIds(tree, row.id);
    const granted = buildQuickGranted(tree, row.id, mode);
    setGrantedMap((prev) => {
      const copy = { ...prev };
      if (mode === 'none') {
        for (const id of ids) delete copy[id];
      } else {
        Object.assign(copy, granted);
      }
      return copy;
    });
  };

  const handleSave = async () => {
    if (!roleId) return;
    setSaving(true);
    try {
      const permission = serializePermissions(grantedMap);
      await api.client.post('/Admin/Role/SavePermission', { roleId, permission });
      message.success('权限保存成功');
      onSaved?.();
      onClose();
    } catch {
      message.error('权限保存失败');
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(() => {
    /** 操作权限单元格：父级行显示 只读/全部/无权限 级联快捷；叶子行渲染全部权限位复选框 + 单行快捷 */
    const renderPerm = (_: unknown, row: PermissionNode) => {
      const quick = (
        <Space size={6}>
          <a onClick={() => handleQuick(row, 'readonly')}>只读</a>
          <a onClick={() => handleQuick(row, 'all')}>全部</a>
          <a onClick={() => handleQuick(row, 'none')}>无权限</a>
        </Space>
      );
      // 父级行（含子菜单）：仅提供级联快捷，避免表单拉长
      if (row.children?.length) return quick;
      if (!row.flags?.length) return <span className="cube-perm-na">-</span>;
      return (
        <Space size={12} wrap>
          <Space size={8}>
            {row.flags.map((f) => (
              <Checkbox
                key={f.value}
                checked={((grantedMap[row.id] ?? 0) & f.value) === f.value}
                onChange={() => toggle(row.id, f.value)}
              >
                {f.name}
              </Checkbox>
            ))}
          </Space>
          {quick}
        </Space>
      );
    };

    return [
      {
        title: '菜单',
        key: 'menu',
        render: (_: unknown, row: PermissionNode) => (
          <Space size={8}>
            <Typography.Text strong>{row.displayName || row.name}</Typography.Text>
            {row.displayName && <Typography.Text type="secondary">{row.name}</Typography.Text>}
          </Space>
        ),
      },
      {
        title: '操作权限',
        key: 'permission',
        render: renderPerm,
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grantedMap, tree]);

  return (
    <Modal
      open={open}
      title={`角色权限${roleName ? ` - ${roleName}` : ''}`}
      width={820}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={saving}
      okText="保存"
      cancelText="取消"
      destroyOnHidden
    >
      <Table<PermissionNode>
        rowKey="id"
        columns={columns}
        dataSource={tree}
        loading={loading}
        size="small"
        pagination={false}
        expandable={{ expandedRowKeys: expandedKeys, onExpandedRowsChange: (keys) => setExpandedKeys(keys as React.Key[]) }}
      />
    </Modal>
  );
}
