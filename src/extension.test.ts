import { describe, it, expect } from 'vitest';
import path from 'path';
import { findAlWorkspaceRoot } from './extension';

function makeFolder(fsPath: string) {
  return { uri: { fsPath } };
}

describe('findAlWorkspaceRoot', () => {
  it('returns root when app/app.json exists', () => {
    const folders = [makeFolder('/project')];
    const exists = (p: string) => p === path.join('/project', 'app', 'app.json');
    expect(findAlWorkspaceRoot(folders, exists)).toBe('/project');
  });

  it('returns root when test/app.json exists', () => {
    const folders = [makeFolder('/project')];
    const exists = (p: string) => p === path.join('/project', 'test', 'app.json');
    expect(findAlWorkspaceRoot(folders, exists)).toBe('/project');
  });

  it('returns parent directory when folder named "app" contains app.json', () => {
    const folders = [makeFolder('/project/app')];
    const exists = (p: string) => p === path.join('/project/app', 'app.json');
    expect(findAlWorkspaceRoot(folders, exists)).toBe('/project');
  });

  it('returns parent directory when folder named "test" contains app.json', () => {
    const folders = [makeFolder('/project/test')];
    const exists = (p: string) => p === path.join('/project/test', 'app.json');
    expect(findAlWorkspaceRoot(folders, exists)).toBe('/project');
  });

  it('returns folder itself when non-app/test folder contains app.json', () => {
    const folders = [makeFolder('/myproject')];
    const exists = (p: string) => p === path.join('/myproject', 'app.json');
    expect(findAlWorkspaceRoot(folders, exists)).toBe('/myproject');
  });

  it('returns undefined when no AL workspace found', () => {
    const folders = [makeFolder('/project')];
    expect(findAlWorkspaceRoot(folders, () => false)).toBeUndefined();
  });

  it('returns undefined when folders is undefined', () => {
    expect(findAlWorkspaceRoot(undefined, () => false)).toBeUndefined();
  });

  it('picks first matching folder in multi-root workspace', () => {
    const folders = [makeFolder('/a'), makeFolder('/b')];
    const exists = (p: string) => p === path.join('/b', 'app', 'app.json');
    expect(findAlWorkspaceRoot(folders, exists)).toBe('/b');
  });
});
