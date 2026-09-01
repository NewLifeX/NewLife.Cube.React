/**
 * 省市区多 Tab 弹层选择器（对齐 MVC city-picker 交互）
 *
 * 交互：面板含 tab 栏（省份/城市/区县/乡镇街道，按 maxLevel 显示），第一个 tab 是省份并按
 * 大区（华北/华东/华中/华南/西南/西北/东北）分组；选中一级自动切换到下一 tab 并加载其子级，
 * 最后一级选中即关闭。PC 用 Popover 弹层，窄屏（<768px）用 Drawer 底部全屏（移动端触控友好）。
 * 值 = 最后选中地区编号（number），受控 value 经 /Cube/AreaParents 解析路径回显。
 */
import { useEffect, useState } from 'react';
import { Drawer, Grid, Input, Popover, Spin } from 'antd';
import { CloseCircleFilled, DownOutlined } from '@ant-design/icons';
import { PLACEHOLDERS, TAB_NAMES, fetchAreaPath, fetchChildren, groupByBigArea, type AreaOption } from './areaData';

export interface AreaTabsPickerProps {
  /** 当前选中地区编号（number）。搜索区一般无值；表单编辑回显时传入 */
  value?: number | null;
  /** 值变更回调（传最后选中的地区编号，清除时为 undefined） */
  onChange?: (id: number | undefined) => void;
  /** 最大层级 1~4：1=省、2=省/市、3=省/市/区、4=省/市/区/乡镇街道 */
  maxLevel?: number;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  style?: React.CSSProperties;
}

const PANEL_WIDTH = 400;
const BODY_HEIGHT = 280;

const navStyle: React.CSSProperties = { display: 'flex', borderBottom: '1px solid #eee', marginBottom: 8 };
const navItemStyle: React.CSSProperties = {
  padding: '8px 14px',
  cursor: 'pointer',
  fontSize: 13,
  color: 'rgba(0,0,0,.65)',
  borderBottom: '2px solid transparent',
  whiteSpace: 'nowrap',
};
const navItemActive: React.CSSProperties = {
  ...navItemStyle,
  color: '#1677ff',
  fontWeight: 600,
  borderBottomColor: '#1677ff',
};
const bodyStyle: React.CSSProperties = { height: BODY_HEIGHT, overflowY: 'auto' };
const groupTitleStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'rgba(0,0,0,.45)',
  padding: '6px 10px',
  background: '#fafafa',
  position: 'sticky',
  top: 0,
};
const itemsStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', padding: '2px 8px 8px' };
const itemStyle: React.CSSProperties = {
  minWidth: 76,
  padding: '6px 12px',
  margin: 4,
  borderRadius: 6,
  cursor: 'pointer',
  textAlign: 'center',
  fontSize: 13,
  color: 'rgba(0,0,0,.75)',
  background: '#f5f5f5',
};
const itemActive: React.CSSProperties = { ...itemStyle, color: '#1677ff', background: '#e6f4ff', fontWeight: 600 };

export default function AreaTabsPicker({
  value,
  onChange,
  maxLevel = 3,
  placeholder,
  disabled,
  allowClear = true,
  style,
}: AreaTabsPickerProps) {
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [path, setPath] = useState<number[]>([]);
  const [pathNames, setPathNames] = useState<string[]>([]);
  const [groups, setGroups] = useState<{ bigArea: string; list: AreaOption[] }[]>([]);
  const [lists, setLists] = useState<AreaOption[][]>([]);
  const [loading, setLoading] = useState(false);

  const displayText = pathNames.join(' / ');

  // 打开面板：确保省级已加载，tab 定位到已选末级
  useEffect(() => {
    if (!open) return;
    if (groups.length === 0) {
      let cancelled = false;
      setLoading(true);
      fetchChildren(0)
        .then((provinces) => {
          if (cancelled) return;
          setGroups(groupByBigArea(provinces));
          setLists((prev) => {
            const next = [...prev];
            next[0] = provinces;
            return next;
          });
          setTab(Math.max(0, path.length - 1));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }
    setTab(Math.max(0, path.length - 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 受控值 → 解析父级路径回显
  useEffect(() => {
    if (value == null || value <= 0) {
      setPath([]);
      setPathNames([]);
      return;
    }
    if (path.length > 0 && path[path.length - 1] === value) return;

    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const ids = await fetchAreaPath(value);
        if (cancelled || ids.length === 0) return;
        const provinces = await fetchChildren(0);
        const nextLists: AreaOption[][] = [];
        nextLists[0] = provinces;
        const names: string[] = [];
        for (let i = 0; i < ids.length && i < maxLevel; i++) {
          const target = nextLists[i].find((o) => o.id === ids[i]);
          if (!target) break;
          names[i] = target.name;
          if (i + 1 < maxLevel) nextLists[i + 1] = await fetchChildren(target.id);
        }
        if (cancelled) return;
        setGroups(groupByBigArea(provinces));
        setLists(nextLists);
        setPath(names.length ? ids.slice(0, names.length) : []);
        setPathNames(names);
        // 回显后 tab 定位到已选末级（对齐 MVC 打开显示已选层级）
        setTab(Math.max(0, names.length - 1));
      } catch {
        // 回显失败保持空态
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, maxLevel]);

  /** 选中第 level 级某地区：更新路径，必要时加载下一级并切换 tab */
  const pick = async (level: number, item: AreaOption) => {
    const nextPath = path.slice(0, level);
    nextPath[level] = item.id;
    const nextNames = pathNames.slice(0, level);
    nextNames[level] = item.name;
    setPath(nextPath);
    setPathNames(nextNames);

    // 最后一级 → 选中完成
    if (level + 1 >= maxLevel) {
      onChange?.(item.id);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const children = await fetchChildren(item.id);
      setLists((prev) => {
        const next = prev.slice(0, level + 1);
        next[level + 1] = children;
        return next;
      });
      setTab(level + 1);
    } finally {
      setLoading(false);
    }
  };

  /** 切换 tab：目标级尚未加载时补加载 */
  const switchTab = async (level: number) => {
    if (level > path.length) return; // 尚未选到该级，不可切
    setTab(level);
    if (!lists[level] && level > 0) {
      const parentId = path[level - 1];
      if (parentId) {
        setLoading(true);
        try {
          const children = await fetchChildren(parentId);
          setLists((prev) => {
            const next = [...prev];
            next[level] = children;
            return next;
          });
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const clear = () => {
    setPath([]);
    setPathNames([]);
    onChange?.(undefined);
  };

  /** 渲染某级列表（省按大区分组，其余平铺） */
  const renderBody = () => {
    if (loading) {
      return (
        <div style={{ height: BODY_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin />
        </div>
      );
    }
    if (tab === 0) {
      return groups.map((g) => (
        <div key={g.bigArea} data-testid="area-tabs-group">
          <div style={groupTitleStyle}>{g.bigArea}</div>
          <div style={itemsStyle}>
            {g.list.map((o) => (
              <div
                key={o.id}
                data-testid="area-tabs-item"
                style={path[0] === o.id ? itemActive : itemStyle}
                onClick={() => void pick(0, o)}
              >
                {o.name}
              </div>
            ))}
          </div>
        </div>
      ));
    }
    const list = lists[tab] ?? [];
    return (
      <div style={itemsStyle}>
        {list.map((o) => (
          <div
            key={o.id}
            data-testid="area-tabs-item"
            style={path[tab] === o.id ? itemActive : itemStyle}
            onClick={() => void pick(tab, o)}
          >
            {o.name}
          </div>
        ))}
      </div>
    );
  };

  const panel = (
    <div data-testid="area-tabs-panel" style={{ width: isMobile ? '100%' : PANEL_WIDTH }}>
      <div style={navStyle}>
        {TAB_NAMES.slice(0, maxLevel).map((name, i) => (
          <span
            key={name}
            data-testid={`area-tabs-nav-${i}`}
            style={i === tab ? navItemActive : navItemStyle}
            onClick={() => void switchTab(i)}
          >
            {name}
          </span>
        ))}
      </div>
      <div style={bodyStyle}>{renderBody()}</div>
    </div>
  );

  const input = (
    <Input
      readOnly
      value={displayText}
      placeholder={placeholder ?? PLACEHOLDERS[Math.min(maxLevel - 1, 3)]}
      disabled={disabled}
      onClick={() => {
        // 移动端 Drawer 由输入框点击打开；PC 由 Popover trigger 管理
        if (isMobile && !disabled) setOpen(true);
      }}
      suffix={
        displayText && allowClear && !disabled ? (
          <CloseCircleFilled
            style={{ fontSize: 12, color: 'rgba(0,0,0,.25)', cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              clear();
            }}
          />
        ) : (
          <DownOutlined style={{ fontSize: 12, color: 'rgba(0,0,0,.25)' }} />
        )
      }
      style={{ width: '100%', ...style }}
    />
  );

  if (isMobile) {
    return (
      <>
        {input}
        <Drawer open={open} onClose={() => setOpen(false)} placement="bottom" height="70%" title="选择地区" closable>
          {panel}
        </Drawer>
      </>
    );
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement="bottomLeft"
      content={panel}
      styles={{ content: { padding: 8 } }}
    >
      {input}
    </Popover>
  );
}
