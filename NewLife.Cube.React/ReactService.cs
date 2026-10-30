using System.Reflection;
using Microsoft.Extensions.FileProviders;
using NewLife.Cube.Extensions;

namespace NewLife.Cube.React;

/// <summary>React front-end skin service</summary>
public static class ReactService
{
    /// <summary>Use the React front-end skin. Registers embedded static assets and the SPA fallback route</summary>
    /// <remarks>UseCube auto-detects and enables referenced skin packages, so this call is normally unnecessary; it only forces the React skin</remarks>
    /// <param name="app"></param>
    /// <param name="env"></param>
    /// <returns></returns>
    public static WebApplication UseReact(this WebApplication app, IWebHostEnvironment env) => app.UseCubeSkin(env, "React");
}

/// <summary>React front-end skin. Discovered automatically by Cube; can be switched by the SpaSkin setting when several skins are referenced</summary>
internal sealed class ReactSkin : ICubeSkin
{
    /// <summary>Skin name</summary>
    public String Name => "React";

    /// <summary>Display name</summary>
    public String DisplayName => "React 19 + Ant Design";

    /// <summary>Create the static asset provider. Assets are embedded into the assembly at build time</summary>
    /// <returns></returns>
    public IFileProvider CreateFileProvider()
    {
        var assembly = Assembly.GetExecutingAssembly();
        return new CubeEmbeddedFileProvider(assembly, "NewLife.Cube.React.wwwroot");
    }
}
