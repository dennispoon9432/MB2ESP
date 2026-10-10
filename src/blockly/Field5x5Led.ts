import * as Blockly from 'blockly';

const DEFAULT_MATRIX = '00000:00000:00000:00000:00000';
const CELL_SIZE = 15;
const CELL_GAP = 3;
const MATRIX_DIM = 5;

export class Field5x5Led extends Blockly.Field {
  public static SERIALIZABLE = true;
  private matrixString: string = DEFAULT_MATRIX;
  private cells: SVGElement[][] = [];
  private isPointerDown = false;
  private dragTargetState: boolean = true;

  constructor(opt_value?: string, opt_validator?: Blockly.FieldValidator) {
    super(opt_value || DEFAULT_MATRIX, opt_validator);
    this.size_ = new Blockly.utils.Size(
      MATRIX_DIM * (CELL_SIZE + CELL_GAP) - CELL_GAP,
      MATRIX_DIM * (CELL_SIZE + CELL_GAP) - CELL_GAP
    );
  }

  public static fromJson(options: any): Field5x5Led {
    return new Field5x5Led(options['value'] || DEFAULT_MATRIX);
  }

  public initView(): void {
    if (!this.fieldGroup_) return;

    this.cells = [];
    const svgRoot = this.fieldGroup_;

    // Background container
    const bgRect = Blockly.utils.dom.createSvgElement('rect', {
      'class': 'blockly5x5Background',
      'x': 0,
      'y': 0,
      'rx': 4,
      'ry': 4,
      'width': MATRIX_DIM * (CELL_SIZE + CELL_GAP) - CELL_GAP + 6,
      'height': MATRIX_DIM * (CELL_SIZE + CELL_GAP) - CELL_GAP + 6,
      'fill': '#141E28',
      'stroke': '#0B121A',
      'stroke-width': '1.5'
    }, svgRoot);

    // Group for LEDs offset by 3px
    const matrixGroup = Blockly.utils.dom.createSvgElement('g', {
      'transform': 'translate(3, 3)'
    }, svgRoot);

    for (let r = 0; r < MATRIX_DIM; r++) {
      this.cells[r] = [];
      for (let c = 0; c < MATRIX_DIM; c++) {
        const x = c * (CELL_SIZE + CELL_GAP);
        const y = r * (CELL_SIZE + CELL_GAP);

        const rect = Blockly.utils.dom.createSvgElement('rect', {
          'class': 'blockly5x5LedCell',
          'x': x,
          'y': y,
          'width': CELL_SIZE,
          'height': CELL_SIZE,
          'rx': 2,
          'ry': 2,
          'fill': '#243342',
          'stroke': '#182430',
          'stroke-width': '1',
          'cursor': 'pointer',
          'data-r': r.toString(),
          'data-c': c.toString()
        }, matrixGroup);

        this.cells[r][c] = rect;

        // Pointer event listeners for touch and mouse toggling
        rect.addEventListener('pointerdown', (e: Event) => {
          e.stopPropagation();
          e.preventDefault();
          this.toggleCell(r, c);
        });

        rect.addEventListener('pointerenter', (e: PointerEvent) => {
          if (e.buttons === 1) { // dragging with mouse or pen
            this.setCell(r, c, this.dragTargetState);
          }
        });
      }
    }

    this.render_();
  }

  public doValueUpdate_(newValue: any): void {
    super.doValueUpdate_(newValue);
    if (typeof newValue === 'string' && newValue.length > 0) {
      this.matrixString = this.normalizeMatrix(newValue);
    } else {
      this.matrixString = DEFAULT_MATRIX;
    }
  }

  private normalizeMatrix(val: string): string {
    const parts = val.split(':');
    if (parts.length === 5) {
      return parts.map(p => p.padEnd(5, '0').slice(0, 5)).join(':');
    }
    // Clean string format of 25 characters
    const clean = val.replace(/[^01]/g, '').padEnd(25, '0').slice(0, 25);
    return [
      clean.slice(0, 5),
      clean.slice(5, 10),
      clean.slice(10, 15),
      clean.slice(15, 20),
      clean.slice(20, 25)
    ].join(':');
  }

  public getText(): string {
    return this.matrixString;
  }

  public getValue(): string {
    return this.matrixString;
  }

  private toggleCell(r: number, c: number): void {
    const rows = this.matrixString.split(':');
    const current = rows[r]?.[c] === '1';
    const nextState = !current;
    this.dragTargetState = nextState;
    this.setCell(r, c, nextState);
  }

  private setCell(r: number, c: number, state: boolean): void {
    const rows = this.matrixString.split(':');
    if (!rows[r]) return;
    const charArr = rows[r].split('');
    charArr[c] = state ? '1' : '0';
    rows[r] = charArr.join('');
    const newStr = rows.join(':');
    this.setValue(newStr);
  }

  protected render_(): void {
    super.render_();
    if (!this.cells || this.cells.length === 0) return;

    const rows = this.matrixString.split(':');
    for (let r = 0; r < MATRIX_DIM; r++) {
      for (let c = 0; c < MATRIX_DIM; c++) {
        const isLit = rows[r]?.[c] === '1';
        const rect = this.cells[r]?.[c];
        if (rect) {
          rect.setAttribute('fill', isLit ? '#FF2222' : '#253545');
          rect.setAttribute('stroke', isLit ? '#FF7777' : '#17222D');
        }
      }
    }
  }

  public updateSize_(): void {
    this.size_ = new Blockly.utils.Size(
      MATRIX_DIM * (CELL_SIZE + CELL_GAP) - CELL_GAP + 6,
      MATRIX_DIM * (CELL_SIZE + CELL_GAP) - CELL_GAP + 6
    );
  }

  public showEditor_(): void {
    // Custom inline field editor: handled directly in initView via pointer events!
  }
}

// Register field in Blockly registry
try {
  Blockly.fieldRegistry.register('field_5x5_led', Field5x5Led);
} catch (e) {
  // Already registered
}
