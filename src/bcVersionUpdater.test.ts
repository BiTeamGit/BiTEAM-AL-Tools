import { describe, it, expect } from 'vitest';
import { calculateRuntime, replaceVersionMajorInYaml, replaceReadmeVersion } from './bcVersionUpdater';

describe('calculateRuntime', () => {
  it('BC28 → runtime 17.0', () => {
    expect(calculateRuntime(28)).toBe('17.0');
  });
  it('BC25 → runtime 14.0', () => {
    expect(calculateRuntime(25)).toBe('14.0');
  });
  it('BC12 → runtime 1.0', () => {
    expect(calculateRuntime(12)).toBe('1.0');
  });
});

describe('replaceVersionMajorInYaml', () => {
  it('replaces Version.Major value', () => {
    const yaml = '- name: Version.Major\n  value: 27';
    expect(replaceVersionMajorInYaml(yaml, 28)).toBe('- name: Version.Major\n  value: 28');
  });
  it('handles quoted values', () => {
    const yaml = "- name: 'Version.Major'\n  value: '27'";
    expect(replaceVersionMajorInYaml(yaml, 28)).toContain("value: '28'");
  });
  it('returns unchanged when pattern not found', () => {
    const yaml = 'unrelated: content';
    expect(replaceVersionMajorInYaml(yaml, 28)).toBe('unrelated: content');
  });
  it('resets Version.Minor and Version.Revision to 0', () => {
    const yaml =
      '- name: Version.Major\n  value: 27\n' +
      '- name: Version.Minor\n  value: 5\n' +
      '- name: Version.Revision\n  value: 42';
    const out = replaceVersionMajorInYaml(yaml, 28);
    expect(out).toContain('name: Version.Major\n  value: 28');
    expect(out).toContain('name: Version.Minor\n  value: 0');
    expect(out).toContain('name: Version.Revision\n  value: 0');
  });
  it('resets quoted Minor/Revision to 0', () => {
    const yaml =
      "- name: 'Version.Major'\n  value: '27'\n" +
      "- name: 'Version.Minor'\n  value: '5'\n" +
      "- name: 'Version.Revision'\n  value: '42'";
    const out = replaceVersionMajorInYaml(yaml, 28);
    expect(out).toContain("value: '0'");
    expect(out).not.toContain("value: '5'");
    expect(out).not.toContain("value: '42'");
  });
});

describe('replaceReadmeVersion', () => {
  it('replaces D365BC version heading', () => {
    const md = '# D365BC-27 Project\n\nSome content.';
    expect(replaceReadmeVersion(md, 28)).toBe('# D365BC-28 Project\n\nSome content.');
  });
  it('returns unchanged when heading not present', () => {
    const md = '# Other Title';
    expect(replaceReadmeVersion(md, 28)).toBe('# Other Title');
  });
});
