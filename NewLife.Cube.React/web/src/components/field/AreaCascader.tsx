/**
 * 省市区级联选择器（对齐 MVC _Area1~_Area4）
 *
 * 按 ReactSetting.areaPickerStyle 分发两种方案：
 * - cascader（默认）：antd 级联下拉，多列并排懒加载
 * - tabs：MVC 风格多 Tab 弹层（省份按大区分组，选一级自动切下一 tab，窄屏 Drawer 全屏）
 * 两者共用数据层 ./areaData（/Cube/AreaChilds、/Cube/AreaParents）。
 */
import { useEffect, useState } from 'react';
import { Cascader } from 'antd';
import { useReactSetting } from '@/stores/reactSetting';
import AreaTabsPicker from './AreaTabsPicker';
import { PLACEHOLDERS, fetchAreaPath, fetchChildren, buildAreaTree, type AreaOption } from './areaData';

// 兼容既有导入（组件测试等）：数据层工具函数与类型
// eslint-disable-next-line no-unused-vars
export { buildAreaTree } from './areaData';
// eslint-disable-next-line no-unused-vars
export type { AreaNode, AreaOption } from './areaData';

export interface AreaCascaderProps {
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

function AreaCascaderDropdown({
  value,
  onChange,
  maxLevel = 3,
  placeholder,
  disabled,
  allowClear = true,
  style,
}: AreaCascaderProps) {
  const [options, setOptions] = useState<AreaOption[]>([]);
  const [path, setPath] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // 初始加载省级选项
  useEffect(() => {
    let cancelled = false;
    fetchChildren(0).then((opts) => {
      if (cancelled) return;
      // 仅一级时省级即叶子，不显示展开箭头
      setOptions(opts.map((o) => ({ ...o, isLeaf: maxLevel <= 1 })));
    });
    return () => {
      cancelled = true;
    };
  }, [maxLevel]);

  // 受控值 → 解析父级路径回显（表单编辑）
  useEffect(() => {
    if (value == null || value <= 0) {
      setPath([]);
      return;
    }
    // 内部路径末级已与值一致，无需重复解析
    if (path.length > 0 && path[path.length - 1] === value) return;

    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const ids = await fetchAreaPath(value);
        if (cancelled || ids.length === 0) return;
        const { root, path: resolved } = await buildAreaTree(ids, maxLevel);
        if (cancelled) return;
        setOptions(root);
        setPath(resolved);
      } catch {
        // 回显失败（地区数据缺失等）保持空态，不打断页面
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, maxLevel]);

  /** 懒加载子级（antd Cascader loadData 回调） */
  const loadData = async (selected: AreaOption[]) => {
    const target = selected[selected.length - 1];
    if (!target || target.children) return;
    // 当前展开节点为第 selected.length 级（1=省），其子级层级 = selected.length + 1
    const childrenLevel = selected.length + 1;
    const children = await fetchChildren(target.id);
    target.children = children.map((c) => ({ ...c, isLeaf: childrenLevel >= maxLevel }));
    setOptions((prev) => [...prev]);
  };

  const handleChange = (val: number[] | undefined) => {
    setPath(val ?? []);
    const last = val?.[val.length - 1];
    onChange?.(typeof last === 'number' ? last : undefined);
  };

  return (
    <Cascader
      options={options}
      value={path}
      loadData={loadData}
      onChange={handleChange}
      fieldNames={{ label: 'name', value: 'id', children: 'children' }}
      changeOnSelect
      allowClear={allowClear}
      disabled={disabled}
      loading={loading}
      placeholder={placeholder ?? PLACEHOLDERS[Math.min(maxLevel - 1, 3)]}
      style={{ width: '100%', ...style }}
    />
  );
}

/** 地区选择器（按 ReactSetting.areaPickerStyle 分发：cascader 级联下拉 / tabs MVC 风格多 Tab 弹层） */
export default function AreaCascader(props: AreaCascaderProps) {
  const { areaPickerStyle } = useReactSetting();
  if (areaPickerStyle === 'tabs') return <AreaTabsPicker {...props} />;
  return <AreaCascaderDropdown {...props} />;
}
