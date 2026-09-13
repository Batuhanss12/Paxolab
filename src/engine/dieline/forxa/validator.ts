/**
 * Forxa StructureEngine — Parameter Validator
 *
 * Tüm structure modülleri tarafından kullanılan ortak validation.
 * Parametre aralıklarını, required alanları ve geometrik kısıtları kontrol eder.
 */

import type {
  StructureParameter,
  ValidationResult,
} from './types';

// ─── Standart Validation ────────────────────────────────────────

export function validateParameters(
  params: Record<string, number>,
  schema: StructureParameter[],
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Required parametreler var mı?
  for (const p of schema) {
    if (p.required && (params[p.key] === undefined || params[p.key] === null)) {
      errors.push(`'${p.key}' parametresi zorunludur`);
    }
  }

  // 2. Aralık kontrolü
  for (const p of schema) {
    const val = params[p.key];
    if (val === undefined || val === null) continue;

    if (typeof val !== 'number' || isNaN(val)) {
      errors.push(`'${p.key}' bir sayı olmalıdır (mevcut: ${val})`);
      continue;
    }

    if (val < p.min) {
      errors.push(`'${p.key}' değeri ${p.min} altında olamaz (mevcut: ${val})`);
    }
    if (val > p.max) {
      errors.push(`'${p.key}' değeri ${p.max} üstünde olamaz (mevcut: ${val})`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ─── Geometrik Kısıt Kontrolü ───────────────────────────────────

export interface GeometricConstraint {
  description: string;
  check: (params: Record<string, number>) => boolean;
  errorMessage: string;
}

export function validateConstraints(
  params: Record<string, number>,
  constraints: GeometricConstraint[],
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const c of constraints) {
    if (!c.check(params)) {
      errors.push(c.errorMessage);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ─── Default Parametre Üret ─────────────────────────────────────

export function getDefaultParams(schema: StructureParameter[]): Record<string, number> {
  const defaults: Record<string, number> = {};
  for (const p of schema) {
    defaults[p.key] = p.default;
  }
  return defaults;
}

// ─── Merge Params (defaults + user) ─────────────────────────────

export function mergeParams(
  defaults: Record<string, number>,
  user: Record<string, number>,
): Record<string, number> {
  return { ...defaults, ...user };
}
