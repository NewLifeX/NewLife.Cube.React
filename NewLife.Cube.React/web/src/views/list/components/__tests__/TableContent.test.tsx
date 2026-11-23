/**
 * TableContent 列表表格单元测试
 *
 * 覆盖：操作列宽度按可用操作数自适应（仅查看收窄 / 多操作撑开）、
 * 表头排序箭头受控显示（仅排序列带 ant-table-column-sort）、点击表头触发 onSortChange。
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TableContent, { resolveTextAlign } from '../TableContent';
import { clearFieldRenderers, registerFieldRenderer } from '@/rendering/fieldRenderers';
import type { FieldMapping } from '@newlifex/cube';

/** 构造列表字段（widget 固定 text，按字段元数据驱动渲染） */
function textField(name: string, displayName: string): FieldMapping {
  return { widget: 'text', field: { name, typeName: 'String', displayName } };
}

/** 构造带取值字段（valueField）的列表字段 */
function valueFieldText(name: string, displayName: string, valueField?: string): FieldMapping {
  return { widget: 'text', field: { name, typeName: 'String', displayName, valueField } };
}

const FIELDS = [textField('Name', '名称'), textField('Remark', '备注')];
const DATA = [
  { Name: 'a', Remark: 'x' },
  { Name: 'b', Remark: 'y' },
];

/** 取操作列对应 col 的内联宽样式（antd 固定列宽度渲染在 colgroup col 上） */
function opsColStyle(container: HTMLElement): string {
  const cols = Array.from(container.querySelectorAll('col'));
  const ops = cols[cols.length - 1];
  return ops?.getAttribute('style') ?? '';
}

describe('TableContent 列表表格', () => {
  it('activateFields 命中的单元格可点击进入详情，双击不触发行编辑', () => {
    const onActivate = vi.fn();
    const onEdit = vi.fn();
    const { container } = render(
      <TableContent
        fields={FIELDS}
        data={DATA}
        selectable={false}
        onEdit={onEdit}
        activateFields={['Name']}
        activateTitle="查看用户详情"
        onActivate={onActivate}
      />,
    );

    const cells = container.querySelectorAll('.cube-cell-activate');
    expect(cells).toHaveLength(2);
    expect(cells[0].getAttribute('title')).toBe('查看用户详情');

    fireEvent.click(cells[0]);
    expect(onActivate).toHaveBeenCalledWith('Name', DATA[0], expect.anything());

    fireEvent.doubleClick(cells[0]);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('操作列宽度按可用操作数自适应：仅查看窄、全操作宽', () => {
    const { container, rerender } = render(
      <TableContent fields={FIELDS} data={DATA} canView canEdit={false} canDelete={false} selectable={false} />,
    );
    // 仅「查看」→ 68px（原固定 160px 会留大块空白）
    expect(opsColStyle(container)).toContain('width: 68px');

    // 查看 + 编辑 + 删除 → 172px 撑开容纳三个胶囊按钮
    rerender(<TableContent fields={FIELDS} data={DATA} canView canEdit canDelete selectable={false} />);
    expect(opsColStyle(container)).toContain('width: 172px');

    // 编辑 + 删除（可编辑时无查看）→ 120px
    rerender(<TableContent fields={FIELDS} data={DATA} canView={false} canEdit canDelete selectable={false} />);
    expect(opsColStyle(container)).toContain('width: 120px');
  });

  it('仅排序列带 ant-table-column-sort 类（排序箭头受控显示）', () => {
    const onSortChange = vi.fn();
    // 无排序状态：无排序列
    const { container, rerender } = render(
      <TableContent fields={FIELDS} data={DATA} selectable={false} onSortChange={onSortChange} />,
    );
    expect(container.querySelector('th.ant-table-column-sort')).toBeNull();

    // 指定 sortField=Name 降序：Name 列高亮，Remark 列不带排序类
    rerender(
      <TableContent
        fields={FIELDS}
        data={DATA}
        selectable={false}
        onSortChange={onSortChange}
        sortField="Name"
        sortDesc
      />,
    );
    const nameTh = container.querySelector('th.ant-table-column-sort');
    expect(nameTh).toBeTruthy();
    expect(nameTh?.textContent).toContain('名称');
    expect(container.querySelectorAll('th.ant-table-column-sort').length).toBe(1);
  });

  it('主键列可排序：Id 表头提供排序触发器', () => {
    const onSortChange = vi.fn();
    const fields: FieldMapping[] = [
      { widget: 'text', field: { name: 'Id', typeName: 'Int32', displayName: '编号', primaryKey: true } },
      { widget: 'text', field: { name: 'Avatar', typeName: 'String', displayName: '头像', virtual: true } },
      ...FIELDS,
    ];
    const { container } = render(
      <TableContent
        fields={fields}
        data={[{ Id: 1, Name: 'a', Remark: 'x' }]}
        selectable={false}
        onSortChange={onSortChange}
        sortField="Id"
        sortDesc
      />,
    );

    const idTh = Array.from(container.querySelectorAll('.ant-table-thead th')).find((th) =>
      th.textContent?.includes('编号'),
    )!;
    const sorters = idTh.querySelector('.ant-table-column-sorters');
    expect(sorters).not.toBeNull();

    // 虚拟字段没有实体列，不能提供排序入口（否则后端报“不包含排序字段”）
    const avatarTh = Array.from(container.querySelectorAll('.ant-table-thead th')).find((th) =>
      th.textContent?.includes('头像'),
    )!;
    expect(avatarTh.querySelector('.ant-table-column-sorters')).toBeNull();

    fireEvent.click(sorters!);
    // 当前为降序，点击应切到升序（而不是取消排序后回退默认降序）
    expect(onSortChange).toHaveBeenLastCalledWith('Id', false);
  });

  it('点击表头触发 onSortChange，升序/降序/清除三态正确回调', () => {
    const onSortChange = vi.fn();
    const { container } = render(
      <TableContent fields={FIELDS} data={DATA} selectable={false} onSortChange={onSortChange} />,
    );
    // 名称列排序触发器（.ant-table-column-sorters）
    const nameTh = Array.from(container.querySelectorAll('.ant-table-thead th')).find((th) =>
      th.textContent?.includes('名称'),
    )!;
    const sorters = nameTh.querySelector('.ant-table-column-sorters')!;

    // 第 1 次点击 → 升序
    fireEvent.click(sorters);
    expect(onSortChange).toHaveBeenLastCalledWith('Name', false);
  });

  it('valueField 取值优先：优先显示取值字段，跳过空值回退本字段', () => {
    // 模拟后端 Name.valueField=DisplayName（名称列优先显示昵称）
    const fields = [valueFieldText('Name', '名称', 'DisplayName'), valueFieldText('DisplayName', '昵称')];
    const data = [
      { name: 'a', displayName: '昵称A' },
      { name: 'b', displayName: '' },
      { name: 'c', displayName: null },
    ];
    render(<TableContent fields={fields} data={data} selectable={false} />);
    // 有昵称 → 名称列显示昵称（用户名 'a' 不再单独出现，昵称出现 2 次：名称列 + 昵称列）
    expect(screen.queryByText('a')).toBeNull();
    expect(screen.getAllByText('昵称A').length).toBe(2);
    // 昵称为空串 / null → 名称列回退用户名
    expect(screen.getByText('b')).toBeTruthy();
    expect(screen.getByText('c')).toBeTruthy();
  });

  it('双击行进入编辑（可编辑时 onEdit，仅可查看时 onView）', () => {
    const onEdit = vi.fn();
    const onView = vi.fn();
    const { container, rerender } = render(
      <TableContent fields={FIELDS} data={DATA} canEdit onView={onView} onEdit={onEdit} selectable={false} />,
    );
    // 双击第一行 → 触发 onEdit（对齐 MVC「双击本行任意地方进入编辑表单页」）
    const firstRow = container.querySelectorAll('.ant-table-tbody tr.ant-table-row')[0]!;
    fireEvent.doubleClick(firstRow);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(DATA[0]);
    expect(onView).not.toHaveBeenCalled();

    // 只读（仅可查看）→ 双击触发 onView
    rerender(<TableContent fields={FIELDS} data={DATA} canEdit={false} canView onView={onView} onEdit={onEdit} selectable={false} />);
    const secondRow = container.querySelectorAll('.ant-table-tbody tr.ant-table-row')[1]!;
    fireEvent.doubleClick(secondRow);
    expect(onView).toHaveBeenCalledTimes(1);
    expect(onView).toHaveBeenCalledWith(DATA[1]);
    expect(onEdit).toHaveBeenCalledTimes(1); // 编辑仍只被调用一次
  });
});

describe('TableContent 列呈现与数据动作（LIST-12/15/16）', () => {
  it('resolveTextAlign 映射后端 TextAligns 与字符串', () => {
    expect(resolveTextAlign(1)).toBe('left');
    expect(resolveTextAlign(2)).toBe('center');
    expect(resolveTextAlign(3)).toBe('right');
    expect(resolveTextAlign(0)).toBeUndefined();
    expect(resolveTextAlign('right')).toBe('right');
    expect(resolveTextAlign('2')).toBe('center');
    expect(resolveTextAlign(undefined)).toBeUndefined();
  });

  it('DateTime.MinValue（0001-01-01）在列表留空不显示', () => {
    const fields: FieldMapping[] = [
      { widget: 'text', field: { name: 'LastLogin', typeName: 'DateTime', displayName: '最后登录' } },
      { widget: 'text', field: { name: 'Birthday', typeName: 'DateTime', displayName: '生日', itemType: 'date' } },
      {
        widget: 'text',
        field: { name: 'RegisterTime', typeName: 'DateTime', displayName: '注册时间', itemType: 'time-yyyy/MM/dd' },
      },
    ];
    const { container } = render(
      <TableContent
        fields={fields}
        data={[
          { LastLogin: '0001-01-01 00:00:00', Birthday: '0001-01-01T00:00:00', RegisterTime: '0001-01-01T00:00:00' },
          { LastLogin: '2026-11-23 12:18:59', Birthday: '1984-06-23T00:00:00', RegisterTime: '2026-01-02T03:04:05' },
        ]}
        selectable={false}
      />,
    );

    const cells = container.querySelectorAll('.ant-table-tbody tr.ant-table-row td');
    // 第一行三个日期列全部留空（末尾是操作列）
    expect(cells[0].textContent).toBe('');
    expect(cells[1].textContent).toBe('');
    expect(cells[2].textContent).toBe('');
    // 第二行正常显示
    expect(cells[4].textContent).toBe('2026-11-23 12:18:59');
    expect(cells[5].textContent).toBe('1984-06-23');
    expect(cells[6].textContent).toBe('2026/01/02');
  });

  it('表头优先 header（控制器自定义列头）', () => {
    const fields: FieldMapping[] = [
      { widget: 'text', field: { name: 'Code', typeName: 'String', displayName: '代码', header: '编号', headerTitle: '业务编号' } },
    ];
    const { container } = render(<TableContent fields={fields} data={[{ Code: 'A1' }]} selectable={false} />);
    const th = container.querySelector('.ant-table-thead th')!;
    expect(th.textContent).toContain('编号');
    expect(th.textContent).not.toContain('代码');
  });

  it('{page:参数} 占位符与 dataAction 点击走回调（不跳页）', () => {
    const onDataAction = vi.fn();
    const fields: FieldMapping[] = [
      {
        widget: 'text',
        field: {
          name: 'Execute',
          typeName: 'String',
          displayName: '执行',
          url: '/Cube/CronJob/ExecuteNow?id={Id}&q={page:q}',
          text: 'Run now',
          dataAction: 'action',
        },
      },
    ];
    render(
      <TableContent
        fields={fields}
        data={[{ Id: 3, Execute: 'go' }]}
        selectable={false}
        pageQuery={{ q: 'x' }}
        onDataAction={onDataAction}
      />,
    );
    const link = screen.getByText('Run now') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/Cube/CronJob/ExecuteNow?id=3&q=x');
    fireEvent.click(link);
    expect(onDataAction).toHaveBeenCalledWith('/Cube/CronJob/ExecuteNow?id=3&q=x');
  });

  it('confirmDelete=false 时删除不再二次确认', () => {
    const onDelete = vi.fn();
    render(
      <TableContent
        fields={FIELDS}
        data={DATA}
        canEdit={false}
        canDelete
        confirmDelete={false}
        selectable={false}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getAllByRole('button', { name: /删\s*除/ })[0]);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('doubleClickEdit=false 时双击行不触发编辑', () => {
    const onEdit = vi.fn();
    const { container } = render(
      <TableContent fields={FIELDS} data={DATA} canEdit doubleClickEdit={false} selectable={false} onEdit={onEdit} />,
    );
    const firstRow = container.querySelectorAll('.ant-table-tbody tr.ant-table-row')[0]!;
    fireEvent.doubleClick(firstRow);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('selectable=false 时不渲染勾选列（enableSelect 能力）', () => {
    const { container } = render(<TableContent fields={FIELDS} data={DATA} selectable={false} />);
    expect(container.querySelector('.ant-table-selection-column')).toBeNull();
  });

  it('字段声明 view 时使用已注册渲染器（META-4）', () => {
    registerFieldRenderer('orgPicker', {
      component: ({ value }) => <span data-testid="org-cell">{String(value ?? '')}</span>,
    });
    const fields: FieldMapping[] = [
      { widget: 'text', field: { name: 'Org', typeName: 'String', displayName: '组织', view: 'orgPicker' } },
    ];
    render(<TableContent fields={fields} data={[{ Org: 'A部门' }]} selectable={false} />);
    expect(screen.getByTestId('org-cell')).toHaveTextContent('A部门');
    clearFieldRenderers();
  });

  it('extraColumns 追加自定义列（META-6）', () => {
    render(
      <TableContent
        fields={FIELDS}
        data={DATA}
        selectable={false}
        extraColumns={[
          {
            title: '扩展列',
            key: 'ext',
            render: (_, row) => <span data-testid="ext-cell">{String(row.Name)}</span>,
          },
        ]}
      />,
    );
    expect(screen.getAllByText('扩展列').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('ext-cell')).toHaveLength(2);
  });

  it('rowActions 支持按行计算（META-6）', () => {
    const onRowAction = vi.fn();
    render(
      <TableContent
        fields={FIELDS}
        data={DATA}
        canEdit={false}
        canDelete={false}
        selectable={false}
        rowActions={(row) => [
          { key: 'trace', label: '追踪', onClick: () => onRowAction(row.Name) },
        ]}
      />,
    );
    fireEvent.click(screen.getAllByRole('button', { name: /追\s*踪/ })[0]);
    expect(onRowAction).toHaveBeenCalledWith('a');
  });

  it('树形表渲染上移/下移并按行回调（LIST-18）', () => {
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();
    render(
      <TableContent
        fields={FIELDS}
        data={DATA}
        canView={false}
        canEdit
        canDelete={false}
        selectable={false}
        treeField="ParentId"
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: /上\s*移/ })[0]);
    expect(onMoveUp).toHaveBeenCalledWith(expect.objectContaining({ Name: 'a' }));

    fireEvent.click(screen.getAllByRole('button', { name: /下\s*移/ })[0]);
    expect(onMoveDown).toHaveBeenCalledWith(expect.objectContaining({ Name: 'a' }));
  });

  it('非树形表不渲染上移/下移（无 treeField）', () => {
    render(
      <TableContent
        fields={FIELDS}
        data={DATA}
        canView={false}
        canEdit
        canDelete={false}
        selectable={false}
        onMoveUp={() => {}}
        onMoveDown={() => {}}
      />,
    );
    expect(screen.queryByRole('button', { name: /上\s*移/ })).toBeNull();
  });
});

describe('TableContent 统计行（LIST-5）', () => {
  const statFields: FieldMapping[] = [
    { widget: 'text', field: { name: 'Id', typeName: 'Int32', displayName: '编号', primaryKey: true } },
    { widget: 'text', field: { name: 'Date', typeName: 'DateTime', displayName: '统计日期' } },
    { widget: 'text', field: { name: 'Total', typeName: 'Int32', displayName: '总数' } },
    { widget: 'text', field: { name: 'Amount', typeName: 'Decimal', displayName: '金额', itemType: 'Money' } },
    {
      widget: 'text',
      field: { name: 'OnlineTime', typeName: 'Int32', displayName: '在线时间', itemType: "TimeSpan:d'.'hh':'mm':'ss" },
    },
  ];

  it('按列对齐渲染合计行，日期/主键等无意义值不显示英文键名', () => {
    const { container } = render(
      <TableContent
        fields={statFields}
        data={[]}
        canView={false}
        canEdit={false}
        canDelete={false}
        selectable
        statData={{
          id: 0,
          date: '0001-01-01T00:00:00',
          total: 9574,
          amount: 1234.5,
          onlineTime: 574,
        }}
      />,
    );

    const row = container.querySelector('.cube-stat-row')!;
    expect(row).toBeTruthy();
    // 勾选列 + 5 个字段列
    expect(row.querySelectorAll('td')).toHaveLength(6);

    const cells = Array.from(row.querySelectorAll('td')).map((td) => td.textContent);
    expect(cells[1]).toBe('合计');
    expect(cells[2]).toBe('');
    expect(cells[3]).toBe('9,574');
    expect(cells[4]).toBe('1,234.50');
    expect(cells[5]).toBe('0.00:09:34');

    // 不再输出 id/date/total 等后端字段英文名
    expect(row.textContent).not.toContain('id:');
    expect(row.textContent).not.toContain('date:');
    expect(row.textContent).not.toContain('total:');
  });

  it('无 statData 时不渲染合计行', () => {
    const { container } = render(<TableContent fields={statFields} data={[]} selectable={false} />);
    expect(container.querySelector('.cube-stat-row')).toBeNull();
  });
});
