import { Injectable } from '@angular/core';
import { SchemaContext } from '../../shared/models';

export interface LlmSqlProvider {
  generateSql(prompt: string, schema: SchemaContext): Promise<string>;
}

export class MockLocalProvider implements LlmSqlProvider {
  async generateSql(prompt: string, schema: SchemaContext): Promise<string> {
    const normalized = prompt.toLocaleLowerCase('tr-TR');
    const table = schema.tables[0];
    const tableName = table ? `"${table.name}"` : 'table_name';

    if (normalized.includes('count') || normalized.includes('say') || normalized.includes('adet')) {
      return `SELECT COUNT(*) AS row_count FROM ${tableName};`;
    }

    if (normalized.includes('ortalama') || normalized.includes('average')) {
      const numeric = table?.columns.find((column) => /int|float|double|decimal|number|real/i.test(column.type));
      return numeric ? `SELECT AVG("${numeric.name}") AS avg_${numeric.name} FROM ${tableName};` : `SELECT * FROM ${tableName} LIMIT 100;`;
    }

    const heightColumn = table?.columns.find((column) => /height|yükseklik|yukseklik|elevation|z/i.test(column.name));
    if ((normalized.includes('yüksek') || normalized.includes('yuksek') || normalized.includes('height')) && heightColumn) {
      return `SELECT * FROM ${tableName} WHERE "${heightColumn.name}" > 10 LIMIT 1000;`;
    }

    const areaColumn = table?.columns.find((column) => /area|alan/i.test(column.name));
    if ((normalized.includes('1000') || normalized.includes('metrekare')) && areaColumn) {
      return `SELECT * FROM ${tableName} WHERE "${areaColumn.name}" > 1000 LIMIT 1000;`;
    }

    return `SELECT * FROM ${tableName} LIMIT 100;`;
  }
}

export class OpenAiProvider implements LlmSqlProvider {
  async generateSql(): Promise<string> {
    throw new Error('OpenAI SQL provider is a placeholder. Configure an API-backed implementation before use.');
  }
}

export class OllamaProvider implements LlmSqlProvider {
  async generateSql(): Promise<string> {
    throw new Error('Ollama SQL provider is a placeholder. Configure a local Ollama endpoint before use.');
  }
}

@Injectable({ providedIn: 'root' })
export class NaturalLanguageQueryService {
  private provider: LlmSqlProvider = new MockLocalProvider();

  setProvider(provider: LlmSqlProvider): void {
    this.provider = provider;
  }

  translateToSql(prompt: string, context: SchemaContext): Promise<string> {
    return this.provider.generateSql(prompt, context);
  }

  executeNaturalLanguageQuery(prompt: string, context: SchemaContext): Promise<string> {
    return this.translateToSql(prompt, context);
  }
}
