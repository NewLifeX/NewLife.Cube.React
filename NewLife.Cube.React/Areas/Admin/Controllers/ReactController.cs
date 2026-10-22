using System.Collections;
using System.ComponentModel;
using System.Globalization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NewLife.Cube.ViewModels;

namespace NewLife.Cube.Areas.Admin.Controllers;

/// <summary>React skin settings controller</summary>
[DisplayName("React skin settings")]
[Description("React skin specific settings, such as form style, stored in the parameter dictionary")]
[AdminArea]
[Menu(31, true, Icon = "Skin")]
public class ReactController : ConfigController<ReactSetting>
{
    /// <summary>Get the UI languages supported by the server, with names localized to the current request language</summary>
    /// <returns>Current language, forced language (null in auto mode) and the language options</returns>
    [HttpGet]
    [AllowAnonymous]
    public ActionResult Languages()
    {
        var current = CubeLocalization.NormalizeCulture(CultureInfo.CurrentUICulture.Name);
        var forced = CubeLocalization.NormalizeCulture(CubeLocalization.GetConfiguredLanguage());
        var list = new List<Object>();
        foreach (var item in Localization.GetLanguages())
        {
            list.Add(new { value = item.Name, label = item.GetDisplayName(), nativeName = item.NativeName });
        }

        return Json(0, null, new { current, forced, autoLabel = L.T("Auto (follow system)"), languages = list });
    }

    /// <summary>Get fields. Add dropdown options for multi-choice settings (form style, description display), rendered as a select by the front end</summary>
    /// <param name="kind">View kind</param>
    /// <returns>Field metadata list</returns>
    public override IList<DataField> GetFields(ViewKinds kind)
    {
        var list = base.GetFields(kind);

        // 表单风格：inline/vertical 两个选项
        var fs = list.FirstOrDefault(e => e.Name == "FormStyle");
        if (fs != null)
        {
            fs.DataSource = _ => new Dictionary<String, String>
            {
                ["inline"] = L.T("Three columns in one row (MVC style)"),
                ["vertical"] = L.T("Label on one line, control on the next (antd style)"),
            };
        }

        // 字段注释显示方式：0/1/2 三个选项
        var dm = list.FirstOrDefault(e => e.Name == "DescMode");
        if (dm != null)
        {
            dm.DataSource = _ => new Dictionary<String, String>
            {
                ["1"] = L.T("Small text after the label"),
                ["2"] = L.T("Question mark tooltip"),
                ["0"] = L.T("Hidden"),
            };
        }

        // 地区选择方案：cascader/tabs
        var ap = list.FirstOrDefault(e => e.Name == "AreaPickerStyle");
        if (ap != null)
        {
            ap.DataSource = _ => new Dictionary<String, String>
            {
                ["cascader"] = L.T("Cascading dropdown"),
                ["tabs"] = L.T("Tabbed popup (MVC style, grouped by region)"),
            };
        }

        return list;
    }
}
