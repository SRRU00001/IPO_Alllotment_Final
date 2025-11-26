import type { IpoRow, IpoRowInput, ApiResponse } from '../types';

class MockApiClient {
  private rows: IpoRow[] = [];
  private ipos: Set<string> = new Set();
  private nextId = 1;

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    this.ipos.add('TechCorp IPO');
    this.ipos.add('GreenEnergy Solutions');
    this.ipos.add('FinTech Innovations');
    this.ipos.add('HealthPlus Ltd');

    const mockRows: IpoRowInput[] = [
      {
        name: 'Amit Kumar',
        pan: 'ABCDE1234F',
        ipoName: 'TechCorp IPO',
        appliedBy: 'online',
        ipoAllotmentStatus: 'Allotted',
        amountApplied: 15000,
        amountReverted: 0,
        notes: 'Full allotment received',
      },
      {
        name: 'Priya Sharma',
        pan: 'BCDEF2345G',
        ipoName: 'TechCorp IPO',
        appliedBy: 'broker',
        ipoAllotmentStatus: 'Not Allotted',
        amountApplied: 15000,
        amountReverted: 15000,
        notes: 'Refund processed',
      },
      {
        name: 'Rahul Verma',
        pan: 'CDEFG3456H',
        ipoName: 'GreenEnergy Solutions',
        appliedBy: 'online',
        ipoAllotmentStatus: 'Pending',
        amountApplied: 20000,
        amountReverted: 0,
      },
      {
        name: 'Sneha Patel',
        pan: 'DEFGH4567I',
        ipoName: 'FinTech Innovations',
        appliedBy: 'offline',
        ipoAllotmentStatus: 'Allotted',
        amountApplied: 10000,
        amountReverted: 5000,
        notes: 'Partial allotment',
      },
      {
        name: 'Vikram Singh',
        pan: 'EFGHI5678J',
        ipoName: 'HealthPlus Ltd',
        appliedBy: 'online',
        ipoAllotmentStatus: 'Refund Received',
        amountApplied: 12000,
        amountReverted: 12000,
      },
    ];

    mockRows.forEach(row => {
      this.rows.push({
        ...row,
        id: `row-${this.nextId++}`,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    });
  }

  private async simulateDelay() {
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));
  }

  async listRows(): Promise<ApiResponse<IpoRow[]>> {
    await this.simulateDelay();
    return {
      success: true,
      data: [...this.rows],
    };
  }

  async listIpos(): Promise<ApiResponse<string[]>> {
    await this.simulateDelay();
    return {
      success: true,
      data: Array.from(this.ipos).sort(),
    };
  }

  async addRow(rowData: IpoRowInput): Promise<ApiResponse<IpoRow>> {
    await this.simulateDelay();

    if (!this.ipos.has(rowData.ipoName)) {
      return {
        success: false,
        error: 'IPO name does not exist. Please create it first.',
      };
    }

    const newRow: IpoRow = {
      ...rowData,
      id: `row-${this.nextId++}`,
      createdAt: new Date().toISOString(),
    };

    this.rows.push(newRow);

    return {
      success: true,
      data: newRow,
    };
  }

  async updateRow(id: string, rowData: Partial<IpoRowInput>): Promise<ApiResponse<IpoRow>> {
    await this.simulateDelay();

    const index = this.rows.findIndex(row => row.id === id);

    if (index === -1) {
      return {
        success: false,
        error: 'Row not found',
      };
    }

    if (rowData.ipoName && !this.ipos.has(rowData.ipoName)) {
      return {
        success: false,
        error: 'IPO name does not exist',
      };
    }

    this.rows[index] = {
      ...this.rows[index],
      ...rowData,
    };

    return {
      success: true,
      data: this.rows[index],
    };
  }

  async deleteRow(id: string): Promise<ApiResponse<void>> {
    await this.simulateDelay();

    const index = this.rows.findIndex(row => row.id === id);

    if (index === -1) {
      return {
        success: false,
        error: 'Row not found',
      };
    }

    this.rows.splice(index, 1);

    return {
      success: true,
    };
  }

  async addIpo(ipoName: string): Promise<ApiResponse<string>> {
    await this.simulateDelay();

    if (this.ipos.has(ipoName)) {
      return {
        success: false,
        error: 'IPO name already exists',
      };
    }

    if (!ipoName.trim()) {
      return {
        success: false,
        error: 'IPO name cannot be empty',
      };
    }

    this.ipos.add(ipoName);

    return {
      success: true,
      data: ipoName,
    };
  }
}

export default MockApiClient;
