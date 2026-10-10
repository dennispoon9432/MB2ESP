import React, { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import { ZoomIn, ZoomOut, Maximize2, Undo2, Redo2 } from 'lucide-react';
import { getToolbox } from '../blockly/toolbox';
import { registerAllBlocks, registerExtensionBlocks } from '../blockly/blocks';
import { generatePythonCode } from '../blockly/pythonGenerator';
import { Project } from '../types/project';
import { AppStrings } from '../i18n/strings';

interface BlocklyWorkspaceProps {
  project: Project;
  onWorkspaceChange: (xml: string, pythonCode: string) => void;
  onOpenExtensions: () => void;
  strings: AppStrings;
  workspaceRef: React.MutableRefObject<Blockly.WorkspaceSvg | null>;
}

export const BlocklyWorkspace: React.FC<BlocklyWorkspaceProps> = ({
  project,
  onWorkspaceChange,
  onOpenExtensions,
  strings,
  workspaceRef
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const changeTimeoutRef = useRef<any>(null);

  useEffect(() => {
    registerAllBlocks();
    registerExtensionBlocks(project.extensions);

    if (!containerRef.current) return;

    // Create custom Blockly theme matching MakeCode palette
    const makeCodeTheme = Blockly.Theme.defineTheme('makecode_dark', {
      name: 'makecode_dark',
      base: Blockly.Themes.Classic,
      componentStyles: {
        workspaceBackgroundColour: '#1E293B',
        toolboxBackgroundColour: '#0F172A',
        toolboxForegroundColour: '#F8FAFC',
        flyoutBackgroundColour: '#1E293B',
        flyoutForegroundColour: '#FFFFFF',
        flyoutOpacity: 0.95,
        scrollbarColour: '#334155',
        scrollbarOpacity: 0.8,
        insertionMarkerColour: '#38BDF8',
        insertionMarkerOpacity: 0.8
      },
      fontStyle: {
        family: 'system-ui, -apple-system, sans-serif',
        weight: '600',
        size: 12
      }
    });

    const toolboxDef = getToolbox(project.extensions);

    const ws = Blockly.inject(containerRef.current, {
      toolbox: toolboxDef,
      theme: makeCodeTheme,
      grid: {
        spacing: 24,
        length: 2,
        colour: '#334155',
        snap: true
      },
      zoom: {
        controls: false, // We render custom MakeCode-style controls below
        wheel: true,
        startScale: 0.95,
        maxScale: 2.5,
        minScale: 0.4,
        scaleSpeed: 1.15
      },
      move: {
        scrollbars: false,
        drag: true,
        wheel: true
      },
      trashcan: true,
      sounds: false,
      renderer: 'geras'
    });

    workspaceRef.current = ws;

    // Load project XML
    try {
      if (project.blocklyXml) {
        const dom = Blockly.utils.xml.textToDom(project.blocklyXml);
        Blockly.Xml.domToWorkspace(dom, ws);
      }
    } catch (err) {
      console.error('Failed to load Blockly XML:', err);
    }

    // Intercept Extensions category click
    ws.registerToolboxCategoryCallback('EXTENSIONS_CATEGORY', () => {
      try {
        (ws.getToolbox() as any)?.clearSelection?.();
      } catch (e) {
        // ignore
      }
      onOpenExtensions();
      return [];
    });

    // Listen to changes
    const changeListener = (e: Blockly.Events.Abstract) => {
      if (e.isUiEvent) return;

      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current);
      }

      changeTimeoutRef.current = setTimeout(() => {
        try {
          const xmlDom = Blockly.Xml.workspaceToDom(ws);
          const xmlText = Blockly.Xml.domToText(xmlDom);
          const pyCode = generatePythonCode(ws, project.extensions);
          onWorkspaceChange(xmlText, pyCode);
        } catch (err) {
          console.error('Workspace serialization error:', err);
        }
      }, 350);
    };

    ws.addChangeListener(changeListener);

    // Initial resize and trigger initial simulation
    setTimeout(() => {
      Blockly.svgResize(ws);
      try {
        const xmlDom = Blockly.Xml.workspaceToDom(ws);
        const xmlText = Blockly.Xml.domToText(xmlDom);
        const pyCode = generatePythonCode(ws, project.extensions);
        onWorkspaceChange(xmlText, pyCode);
      } catch (e) {}
    }, 150);

    const resizeObserver = new ResizeObserver(() => {
      Blockly.svgResize(ws);
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (changeTimeoutRef.current) clearTimeout(changeTimeoutRef.current);
      ws.dispose();
      workspaceRef.current = null;
    };
  }, []);

  // Update toolbox when extensions change
  useEffect(() => {
    if (workspaceRef.current) {
      registerExtensionBlocks(project.extensions);
      const toolboxDef = getToolbox(project.extensions);
      workspaceRef.current.updateToolbox(toolboxDef);
    }
  }, [project.extensions]);

  const handleZoomIn = () => {
    workspaceRef.current?.zoomCenter(1);
  };

  const handleZoomOut = () => {
    workspaceRef.current?.zoomCenter(-1);
  };

  const handleZoomReset = () => {
    if (workspaceRef.current) {
      workspaceRef.current.setScale(1.0);
      workspaceRef.current.scrollCenter();
    }
  };

  const handleUndo = () => {
    workspaceRef.current?.undo(false);
  };

  const handleRedo = () => {
    workspaceRef.current?.undo(true);
  };

  return (
    <div className="relative flex-1 h-full w-full bg-slate-900 overflow-hidden">
      {/* Blockly Injection Root */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating MakeCode-style Undo/Redo & Zoom Controls (Bottom Right) */}
      <div className="absolute bottom-5 right-5 flex items-center gap-1.5 bg-slate-950/90 backdrop-blur border border-slate-700/80 p-1.5 rounded-2xl shadow-2xl z-20">
        <button
          onClick={handleUndo}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition active:scale-95 touch-manipulation"
          title={strings.undo}
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={handleRedo}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition active:scale-95 touch-manipulation"
          title={strings.redo}
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-slate-800 mx-0.5" />

        <button
          onClick={handleZoomIn}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition active:scale-95 touch-manipulation"
          title={strings.zoomIn}
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={handleZoomOut}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition active:scale-95 touch-manipulation"
          title={strings.zoomOut}
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={handleZoomReset}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition active:scale-95 touch-manipulation"
          title={strings.zoomReset}
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
