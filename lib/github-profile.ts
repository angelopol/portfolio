import "server-only";

export async function getGithubProfile(username: string, repository: string) {
  if (
    !/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(username) ||
    !/^[\w.-]{1,100}$/.test(repository)
  )
    throw new Error("Usuario o repositorio de GitHub inválido.");
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repository)}/readme`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!response.ok)
    throw new Error(
      response.status === 404
        ? "No se encontró el README del perfil."
        : "GitHub no está disponible en este momento.",
    );
  const data = (await response.json()) as {
    content: string;
    html_url: string;
    path: string;
  };
  const markdown = Buffer.from(data.content, "base64").toString("utf8");
  if (markdown.length > 200000)
    throw new Error("El README es demasiado grande.");
  const branch = new URL(data.html_url).pathname.split("/")[4];
  return {
    markdown,
    url: data.html_url,
    rawBase: `https://raw.githubusercontent.com/${username}/${repository}/${branch}/`,
    linkBase: `https://github.com/${username}/${repository}/blob/${branch}/`,
  };
}
