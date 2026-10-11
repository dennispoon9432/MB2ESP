import { Project, DEFAULT_START_BLOCKLY_XML } from '../types/project';

import { LEGACY_PIN_TO_GPIO_MAP } from '../board/pinMap';

const STORAGE_KEY_PROJECTS = 'mb2esp_projects_v1';
const STORAGE_KEY_ACTIVE_ID = 'mb2esp_active_project_id_v1';

export function migrateProjectPins(project: Project): Project {
  if ((project as any).pinsMigratedV2) {
    return project;
  }

  let updatedXml = project.blocklyXml;
  if (updatedXml) {
    // Convert PIN dropdown values in Blockly XML: P0->1, P1->2, ... P8->17
    updatedXml = updatedXml.replace(
      /(<field\s+name="PIN">)(P?[0-8])(<\/field>)/gi,
      (_match, open, pinVal, close) => {
        const key = pinVal.toUpperCase();
        const mapped = LEGACY_PIN_TO_GPIO_MAP[key] || LEGACY_PIN_TO_GPIO_MAP[pinVal] || pinVal;
        return `${open}${mapped}${close}`;
      }
    );
  }

  let updatedPy = project.pythonCode;
  // If user has not hand-edited Python, convert generated python pin calls too
  if (!project.isPythonEdited && updatedPy) {
    updatedPy = updatedPy.replace(
      /\b(pin_write|pin_read|analog_read|analog_write|servo|servo_stop|servo_continuous|neopixel_init)\s*\(\s*(P?[0-8])(\s*[,)])/g,
      (_match, fn, pinVal, suffix) => {
        const key = pinVal.toUpperCase();
        const mapped = LEGACY_PIN_TO_GPIO_MAP[key] || LEGACY_PIN_TO_GPIO_MAP[pinVal] || pinVal;
        return `${fn}(${mapped}${suffix}`;
      }
    );
  }

  return {
    ...project,
    blocklyXml: updatedXml,
    pythonCode: updatedPy,
    pinsMigratedV2: true
  } as Project;
}

export function getAllProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (!raw) {
      const initial = createInitialProject();
      saveProjectsList([initial]);
      return [initial];
    }
    const projects: Project[] = JSON.parse(raw);
    if (!projects || projects.length === 0) {
      const initial = createInitialProject();
      saveProjectsList([initial]);
      return [initial];
    }

    let neededSave = false;
    const migrated = projects.map(p => {
      const m = migrateProjectPins(p);
      if (m !== p) neededSave = true;
      return m;
    });

    if (neededSave) {
      saveProjectsList(migrated);
    }

    return migrated.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (err) {
    console.error('Failed to load projects from storage:', err);
    const initial = createInitialProject();
    return [initial];
  }
}

export function saveProjectsList(projects: Project[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
  } catch (err) {
    console.error('Failed to save projects list:', err);
  }
}

export function saveProject(project: Project): void {
  const projects = getAllProjects();
  const idx = projects.findIndex(p => p.id === project.id);
  const updated: Project = {
    ...project,
    updatedAt: Date.now()
  };

  if (idx >= 0) {
    projects[idx] = updated;
  } else {
    projects.unshift(updated);
  }
  saveProjectsList(projects);
}

export function getProjectById(id: string): Project | null {
  const projects = getAllProjects();
  return projects.find(p => p.id === id) || null;
}

export function createNewProject(name?: string): Project {
  const id = 'proj_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
  const newProj: Project = {
    id,
    name: name || 'Untitled Project',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    blocklyXml: DEFAULT_START_BLOCKLY_XML,
    pythonCode: '',
    isPythonMode: false,
    isPythonEdited: false,
    extensions: [],
    settings: {
      bleChunkSize: 180,
      language: 'en',
      simulatorSpeed: 1,
      boardId: ''
    }
  };

  const projects = getAllProjects();
  projects.unshift(newProj);
  saveProjectsList(projects);
  setActiveProjectId(newProj.id);
  return newProj;
}

function createInitialProject(): Project {
  return {
    id: 'proj_starter_sample',
    name: 'OLED Screen Demo',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    blocklyXml: DEFAULT_START_BLOCKLY_XML,
    pythonCode: `from pixl import *

# on start
oled.clear()
oled.text("MB2ESP", 0, 0)

@forever
def loop():
    oled.text("Running...", 0, 24)
    pause(500)

run()`,
    isPythonMode: false,
    isPythonEdited: false,
    extensions: [],
    settings: {
      bleChunkSize: 180,
      language: 'en',
      simulatorSpeed: 1,
      boardId: ''
    }
  };
}

export function deleteProject(id: string): void {
  const projects = getAllProjects().filter(p => p.id !== id);
  if (projects.length === 0) {
    const fresh = createInitialProject();
    saveProjectsList([fresh]);
    setActiveProjectId(fresh.id);
  } else {
    saveProjectsList(projects);
    const active = getActiveProjectId();
    if (active === id) {
      setActiveProjectId(projects[0].id);
    }
  }
}

export function duplicateProject(id: string): Project | null {
  const orig = getProjectById(id);
  if (!orig) return null;

  const clone: Project = {
    ...orig,
    id: 'proj_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36),
    name: `${orig.name} (Copy)`,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const projects = getAllProjects();
  projects.unshift(clone);
  saveProjectsList(projects);
  return clone;
}

export function getActiveProjectId(): string {
  return localStorage.getItem(STORAGE_KEY_ACTIVE_ID) || '';
}

export function setActiveProjectId(id: string): void {
  localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
}

export function exportProjectToFile(project: Project): void {
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'project'}.pixl`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importProjectFromJson(jsonString: string): Project {
  const parsed = JSON.parse(jsonString) as Project;
  if (!parsed.name) {
    throw new Error('Invalid project file: missing name');
  }

  const rawImported: Project = {
    ...parsed,
    id: 'proj_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36),
    name: parsed.name + ' (Imported)',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const imported = migrateProjectPins(rawImported);
  const projects = getAllProjects();
  projects.unshift(imported);
  saveProjectsList(projects);
  setActiveProjectId(imported.id);
  return imported;
}
