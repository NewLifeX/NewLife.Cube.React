using System.Collections;
using System.ComponentModel;
using NewLife.Cube.ViewModels;

namespace NewLife.Cube.Areas.Admin.Controllers;

/// <summary>React皮肤设置控制器</summary>
[DisplayName("React皮肤设置")]
[Description("React前端皮肤专属配置，如表单风格等，数据存数据库参数字典表")]
[AdminArea]
[Menu(31, true, Icon = "Skin")]
public class ReactController : ConfigController<ReactSetting>
{
    /// <summary>获取字段。为多选项配置（表单风格/注释显示方式）补充下拉选项，前端渲染为下拉选择</summary>
    /// <param name="kind">视图类型</param>
    /// <returns>字段元数据列表</returns>
    public override IList<DataField> GetFields(ViewKinds kind)
    {
        var list = base.GetFields(kind);

        // 表单风格：inline/vertical 两个选项
        var fs = list.FirstOrDefault(e => e.Name == "FormStyle");
        if (fs != null)
        {
            fs.DataSource = _ => new Dictionary<String, String>
            {
                ["inline"] = "三栏同排（对齐MVC）",
                ["vertical"] = "标签一行控件一行（antd6风格）",
            };
        }

        // 字段注释显示方式：0/1/2 三个选项
        var dm = list.FirstOrDefault(e => e.Name == "DescMode");
        if (dm != null)
        {
            dm.DataSource = _ => new Dictionary<String, String>
            {
                ["1"] = "标签后小字",
                ["2"] = "问号图标悬浮提示",
                ["0"] = "不显示",
            };
        }

        return list;
    }
}
