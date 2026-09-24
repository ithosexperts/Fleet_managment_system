import https from 'node:https';
import http from 'node:http';
import { URL } from 'node:url';

export interface SelectOptions {
  table: string;
  columns?: string[] | string;
  alias?: string;
  joins?: Array<{
    table: string;
    on: string;
    type?: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
    alias?: string;
  }>;
  where?: Record<string, any>;
  filters?: Record<string, any>;
  groupBy?: string;
  having?: Record<string, any>;
  orderBy?: string;
  page?: number;
  limit?: number;
  top?: number;
  fetchAll?: boolean;
  distinct?: boolean;
  debug?: boolean;
}

export interface SelectResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  returnedRows?: number;
  totalRows?: number;
  totalPages?: number;
  currentPage?: number;
  data?: T[];
  error?: any;
  debug?: any;
}

export interface ALTimeStampPayload {
  PLTimeStamp?: string | null;
  ALTimeStamp?: string | null;
  DoerCode: string;
  RowID: number;
  AppID: string;
  StageNo: string;
  LeadTimeMins?: number;
  KPIApplicable?: 'Y' | 'N';
  ALHelper?: string;
}

export interface ALTimeStampResponse {
  status: 'success' | 'error';
  message?: string;
  file_marker?: string;
  procedure?: string;
  DelayMins?: number;
  TaskStatus?: string;
  updatedRow?: any;
  error?: any;
}

export interface Pack2DispatchResponse {
  status: 'success' | 'error';
  message?: string;
  procedure?: string;
  DocEntrySO?: number;
  updatedRow?: any;
  error?: any;
}

export class HoseXpertsApiClient {
  private apiUrl: string;
  private rejectUnauthorized: boolean;

  constructor(apiUrl?: string, rejectUnauthorized?: boolean) {
    this.apiUrl = apiUrl || process.env.HOSEXPERTS_API_URL || 'https://api.hosexperts.com:85/apiv2.php';
    this.rejectUnauthorized = rejectUnauthorized ?? (process.env.HOSEXPERTS_API_REJECT_UNAUTHORIZED === 'true');
  }

  /**
   * Helper to perform HTTP/HTTPS JSON requests to HoseXperts apiv2.php
   */
  private async sendRequest<T = any>(payload: Record<string, any>, method: 'POST' | 'GET' = 'POST'): Promise<T> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(this.apiUrl);
      const isHttps = parsedUrl.protocol === 'https:';
      const transport = isHttps ? https : http;

      const bodyData = method === 'POST' ? JSON.stringify(payload) : '';

      const options: https.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'TruckTracker-FMS/2.0',
          ...(method === 'POST' ? { 'Content-Length': Buffer.byteLength(bodyData) } : {})
        },
        timeout: 30000,
        ...(isHttps ? { rejectUnauthorized: this.rejectUnauthorized } : {})
      };

      const req = transport.request(options, (res) => {
        let rawData = '';

        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          rawData += chunk;
        });

        res.on('end', () => {
          try {
            if (!rawData) {
              return resolve({ status: 'error', message: 'Empty response from server' } as T);
            }
            const parsed = JSON.parse(rawData);
            resolve(parsed as T);
          } catch (err: any) {
            reject(new Error(`Failed to parse HoseXperts API JSON response: ${err.message}. Raw: ${rawData.slice(0, 300)}`));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`HoseXperts API request timed out after 30000ms: ${this.apiUrl}`));
      });

      req.on('error', (err) => {
        reject(new Error(`HoseXperts API network error: ${err.message}`));
      });

      if (method === 'POST' && bodyData) {
        req.write(bodyData);
      }
      req.end();
    });
  }

  /**
   * Generic SELECT query against company database tables (e.g. Z_SalesOrder, Drivers, Vehicles)
   */
  async select<T = any>(options: SelectOptions): Promise<SelectResponse<T>> {
    const payload = {
      action: 'select',
      ...options
    };
    return this.sendRequest<SelectResponse<T>>(payload, 'POST');
  }

  /**
   * Insert record into company database
   */
  async insert(table: string, data: Record<string, any>): Promise<any> {
    const payload = {
      action: 'insert',
      table,
      data
    };
    return this.sendRequest(payload, 'POST');
  }

  /**
   * Update records in company database
   */
  async update(table: string, data: Record<string, any>, where: Record<string, any>): Promise<any> {
    const payload = {
      action: 'update',
      table,
      data,
      where
    };
    return this.sendRequest(payload, 'POST');
  }

  /**
   * Delete records in company database
   */
  async delete(table: string, where: Record<string, any>): Promise<any> {
    const payload = {
      action: 'delete',
      table,
      where
    };
    return this.sendRequest(payload, 'POST');
  }

  /**
   * Fetch table column metadata
   */
  async metadata(table: string): Promise<any> {
    const payload = {
      action: 'metadata',
      table
    };
    return this.sendRequest(payload, 'POST');
  }

  /**
   * Execute SP_FMS_ALTimeStampStatus stored procedure
   * Used for task actual timestamp status, delay tracking, and stage updates
   */
  async executeALTimeStampStatus(params: ALTimeStampPayload): Promise<ALTimeStampResponse> {
    const payload = {
      table: 'Z_SalesOrder',
      action: 'save_task',
      procedure: 'SP_FMS_ALTimeStampStatus',
      data: {
        PLTimeStamp: params.PLTimeStamp || null,
        ALTimeStamp: params.ALTimeStamp || null,
        DoerCode: params.DoerCode,
        RowID: params.RowID,
        AppID: params.AppID,
        StageNo: params.StageNo,
        LeadTimeMins: params.LeadTimeMins ?? 0,
        KPIApplicable: params.KPIApplicable ?? 'N',
        ALHelper: params.ALHelper ?? 'FMS'
      }
    };
    return this.sendRequest<ALTimeStampResponse>(payload, 'POST');
  }

  /**
   * Execute SP_FMS_Pack2Dispatch_S2 stored procedure
   * Links sales orders to packing/dispatch stage
   */
  async executePack2Dispatch(docEntrySO: number): Promise<Pack2DispatchResponse> {
    const payload = {
      table: 'Z_SalesOrder',
      action: 'procedure',
      procedure: 'SP_FMS_Pack2Dispatch_S2',
      data: {
        DocEntrySO: docEntrySO
      }
    };
    return this.sendRequest<Pack2DispatchResponse>(payload, 'POST');
  }

  /**
   * Fetch dependent dropdown options
   */
  async getDependentList(table: string, selectColumn: string, filterColumn?: string, filterValue?: string): Promise<any> {
    const payload = {
      action: 'get_dependent_list',
      table,
      select_column: selectColumn,
      filter_column: filterColumn,
      filter_value: filterValue
    };
    return this.sendRequest(payload, 'POST');
  }

  /**
   * Health/Ping check against apiv2.php
   */
  async ping(): Promise<{ ok: boolean; statusText?: string; error?: string }> {
    try {
      // apiv2.php requires table, so we query TM_Form_Settings or Z_SalesOrder with top=1
      const res = await this.select({ table: 'Z_SalesOrder', top: 1 });
      if (res && (res.status === 'success' || res.data !== undefined)) {
        return { ok: true, statusText: 'Connected to HoseXperts apiv2.php' };
      }
      return { ok: false, error: res.message || 'Non-success response from apiv2.php' };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }
}

export const hosexpertsApi = new HoseXpertsApiClient();
