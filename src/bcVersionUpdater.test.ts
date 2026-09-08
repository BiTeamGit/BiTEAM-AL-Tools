import { describe, it, expect } from 'vitest';
import { calculateRuntime, replaceVersionMajorInYaml, replaceVersionMinorInYaml, replaceReadmeVersion } from './bcVersionUpdater';

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
});

describe('replaceVersionMinorInYaml', () => {
  it('resets Version.Minor value to 0', () => {
    const yaml = '- name: Version.Minor\n  value: 1';
    expect(replaceVersionMinorInYaml(yaml)).toBe('- name: Version.Minor\n  value: 0');
  });
  it('handles quoted values', () => {
    const yaml = "- name:     'Version.Minor'\n    value:    '1'";
    expect(replaceVersionMinorInYaml(yaml)).toContain("value:    '0'");
  });
  it('leaves value unchanged when already 0', () => {
    const yaml = '- name: Version.Minor\n  value: 0';
    expect(replaceVersionMinorInYaml(yaml)).toBe('- name: Version.Minor\n  value: 0');
  });
  it('returns unchanged when pattern not found', () => {
    const yaml = 'unrelated: content';
    expect(replaceVersionMinorInYaml(yaml)).toBe('unrelated: content');
  });
  it('resets Minor without touching Major when both are present', () => {
    const yaml = "- name:     'Version.Major'\n    value:    '27'\n  - name:     'Version.Minor'\n    value:    '1'";
    const result = replaceVersionMinorInYaml(replaceVersionMajorInYaml(yaml, 28));
    expect(result).toBe("- name:     'Version.Major'\n    value:    '28'\n  - name:     'Version.Minor'\n    value:    '0'");
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
