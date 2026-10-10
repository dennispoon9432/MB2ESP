import { BUILTIN_EXTENSIONS } from '../types/extension';
import { ProjectExtension } from '../types/project';

export function getBuiltinExtensions(): ProjectExtension[] {
  return [...BUILTIN_EXTENSIONS];
}

export function parseGitHubRepo(url: string): { owner: string; repo: string } | null {
  const clean = url.trim().replace(/\/$/, '');
  const match = clean.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, '')
  };
}

export async function fetchExtensionFromGitHub(urlOrRepo: string): Promise<ProjectExtension> {
  const parsed = parseGitHubRepo(urlOrRepo);
  if (!parsed) {
    throw new Error('Invalid GitHub repository URL. Format: https://github.com/owner/repository');
  }

  const { owner, repo } = parsed;
  const branches = ['main', 'master'];

  let blocksJson: any = null;
  let extPy: string = '';
  let lastError: Error | null = null;

  for (const branch of branches) {
    try {
      const blocksUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/blocks.json`;
      const extPyUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/ext.py`;

      const [blocksRes, extRes] = await Promise.all([
        fetch(blocksUrl),
        fetch(extPyUrl)
      ]);

      if (blocksRes.ok && extRes.ok) {
        blocksJson = await blocksRes.json();
        extPy = await extRes.text();
        break;
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  if (!blocksJson || !extPy) {
    throw new Error(
      lastError?.message ||
      `Could not load blocks.json and ext.py from https://github.com/${owner}/${repo} (checked main and master branches).`
    );
  }

  const name = blocksJson.name || repo;
  const category = blocksJson.category || repo;
  const color = blocksJson.color || '#607D8B';
  const description = blocksJson.description || `Extension loaded from ${owner}/${repo}`;
  const blocks = Array.isArray(blocksJson.blocks) ? blocksJson.blocks : [];

  const ext: ProjectExtension = {
    id: `ext_${owner}_${repo}`.toLowerCase(),
    name,
    category,
    color,
    description,
    extPy,
    blocksJson: blocks,
    repoUrl: `https://github.com/${owner}/${repo}`,
    isBuiltIn: false
  };

  return ext;
}
