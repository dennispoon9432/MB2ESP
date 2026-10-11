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
  boardId?: string; // 4-char hex suffix e.g. "A1B2", empty means any PIXL-XXXX
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
      <block type="mb_oled_clear">
        <next>
          <block type="mb_oled_show_text">
            <value name="TEXT">
              <shadow type="text">
                <field name="TEXT">MB2ESP</field>
              </shadow>
            </value>
            <value name="X">
              <shadow type="mb_math_number">
                <field name="NUM">0</field>
              </shadow>
            </value>
            <value name="Y">
              <shadow type="mb_math_number">
                <field name="NUM">0</field>
              </shadow>
            </value>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="mb_forever" x="80" y="240">
    <statement name="DO">
      <block type="mb_oled_show_text">
        <value name="TEXT">
          <shadow type="text">
            <field name="TEXT">Running...</field>
          </shadow>
        </value>
        <value name="X">
          <shadow type="mb_math_number">
            <field name="NUM">0</field>
          </shadow>
        </value>
        <value name="Y">
          <shadow type="mb_math_number">
            <field name="NUM">24</field>
          </shadow>
        </value>
        <next>
          <block type="mb_pause">
            <value name="MS">
              <shadow type="mb_math_number">
                <field name="NUM">500</field>
              </shadow>
            </value>
          </block>
        </next>
      </block>
    </statement>
  </block>
</xml>`;
