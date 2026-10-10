export interface ProjectExtension {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  category?: string;
  extPy: string;
  blocksJson?: any[];
  repoUrl?: string;
  isBuiltIn?: boolean;
}

export interface ProjectSettings {
  bleChunkSize: number;
  language: 'en' | 'zh';
  simulatorSpeed: number;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  // Blockly serialized XML or JSON workspace state
  blocklyXml: string;
  // Python code (either generated or manually authored)
  pythonCode: string;
  // True if user switched to Python-only editing mode
  isPythonMode: boolean;
  isPythonEdited: boolean;
  // Installed extensions for this project
  extensions: ProjectExtension[];
  // Project settings
  settings: ProjectSettings;
  // Optional thumbnail preview (e.g. 5x5 LED string or snapshot)
  thumbnailLed?: string;
}

export const DEFAULT_START_BLOCKLY_XML = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="mb_on_start" x="80" y="50">
    <statement name="DO">
      <block type="mb_show_icon">
        <field name="ICON">HEART</field>
        <next>
          <block type="mb_show_string">
            <field name="TEXT">Hello MB2ESP</field>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="mb_forever" x="80" y="220">
    <statement name="DO">
      <block type="mb_show_icon">
        <field name="ICON">HEART</field>
        <next>
          <block type="mb_pause">
            <field name="MS">500</field>
            <next>
              <block type="mb_show_icon">
                <field name="ICON">SMALL_HEART</field>
                <next>
                  <block type="mb_pause">
                    <field name="MS">500</field>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>
</xml>`;
