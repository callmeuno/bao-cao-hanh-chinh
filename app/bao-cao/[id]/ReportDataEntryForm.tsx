'use client';

import { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { saveReportValuesAction, type ValueItem } from '../actions';

export type ReportDetail = {
  id: string;
  title: string;
  year: number;
  report_type: string;
  period_start: string | null;
  period_end: string | null;
  status: string;
  department_id: string;
  submitted_by: string | null;
  created_at: string;
  departments: {
    id: string;
    code: string;
    name: string;
  } | null;
};

export type IndicatorItem = {
  id: string;
  code: string;
  name: string;
  unit: string | null;
  data_type: string;
  description: string | null;
};

export type ExistingReportValue = {
  id: string;
  indicator_id: string;
  value_numeric: number | null;
  value_text: string | null;
  note: string | null;
};

type Props = {
  report: ReportDetail;
  indicators: IndicatorItem[];
  initialValues: ExistingReportValue[];
};

type RowState = {
  value: string;
  note: string;
};

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; desc: string }> = {
  draft: {
    label: 'Bản nháp',
    badgeClass: 'badge badge-gray',
    desc: 'Đang soạn thảo - có thể chỉnh sửa số liệu',
  },
  submitted: {
    label: 'Đã nộp',
    badgeClass: 'badge badge-blue',
    desc: 'Đã nộp lên cấp trên - chỉ xem, không thể chỉnh sửa',
  },
  approved: {
    label: 'Đã phê duyệt',
    badgeClass: 'badge badge-green',
    desc: 'Báo cáo chính thức - dữ liệu được bảo vệ',
  },
  rejected: {
    label: 'Từ chối',
    badgeClass: 'badge',
    desc: 'Yêu cầu cập nhật lại - có thể chỉnh sửa số liệu',
  },
};

export function ReportDataEntryForm({ report, indicators, initialValues }: Props) {
  const [isPending, startTransition] = useTransition();

  // Khởi tạo state dữ liệu nhập từ các bản ghi có sẵn trong DB
  const [rows, setRows] = useState<Record<string, RowState>>(() => {
    const map: Record<string, RowState> = {};
    const existingMap = new Map<string, ExistingReportValue>();
    for (const v of initialValues) {
      existingMap.set(v.indicator_id, v);
    }

    for (const ind of indicators) {
      const exist = existingMap.get(ind.id);
      if (exist) {
        let valStr = '';
        if (exist.value_numeric !== null && exist.value_numeric !== undefined) {
          valStr = String(exist.value_numeric);
        } else if (exist.value_text !== null && exist.value_text !== undefined) {
          valStr = exist.value_text;
        }
        map[ind.id] = {
          value: valStr,
          note: exist.note || '',
        };
      } else {
        map[ind.id] = {
          value: '',
          note: '',
        };
      }
    }
    return map;
  });

  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const isEditable = report.status === 'draft' || report.status === 'rejected';
  const statusInfo = STATUS_CONFIG[report.status] || {
    label: report.status,
    badgeClass: 'badge badge-gray',
    desc: '',
  };

  const handleValueChange = (indicatorId: string, val: string) => {
    setRows((prev) => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        value: val,
      },
    }));
  };

  const handleNoteChange = (indicatorId: string, note: string) => {
    setRows((prev) => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        note,
      },
    }));
  };

  // Lọc chỉ tiêu theo từ khóa tìm kiếm
  const filteredIndicators = useMemo(() => {
    if (!search.trim()) return indicators;
    const q = search.trim().toLowerCase();
    return indicators.filter(
      (ind) =>
        ind.code.toLowerCase().includes(q) ||
        ind.name.toLowerCase().includes(q) ||
        (ind.unit && ind.unit.toLowerCase().includes(q))
    );
  }, [indicators, search]);

  // Thống kê số lượng chỉ tiêu đã nhập
  const filledCount = useMemo(() => {
    let count = 0;
    for (const ind of indicators) {
      const r = rows[ind.id];
      if (r && (r.value.trim() !== '' || r.note.trim() !== '')) {
        count++;
      }
    }
    return count;
  }, [indicators, rows]);

  const handleSave = () => {
    if (!isEditable) return;
    setFeedback(null);

    // Kiểm tra tính hợp lệ của số liệu cho các chỉ tiêu dạng số/tỷ lệ %
    const invalidIndicators: string[] = [];
    for (const ind of indicators) {
      const r = rows[ind.id];
      if (!r) continue;

      const raw = r.value.trim();
      if (raw !== '') {
        if (ind.data_type === 'number' || ind.data_type === 'percentage') {
          const normalized = raw.replace(',', '.');
          const num = Number(normalized);
          if (isNaN(num) || !Number.isFinite(num)) {
            invalidIndicators.push(`${ind.code} (${ind.name})`);
          }
        }
      }
    }

    if (invalidIndicators.length > 0) {
      setFeedback({
        type: 'error',
        message: `Số liệu nhập không phải là số hợp lệ tại chỉ tiêu: ${invalidIndicators.join('; ')}. Vui lòng kiểm tra lại trước khi lưu nháp.`,
      });
      return;
    }

    // Chuẩn bị danh sách payload
    const items: ValueItem[] = [];
    for (const ind of indicators) {
      const r = rows[ind.id];
      if (!r) continue;

      const raw = r.value.trim();
      const hasValue = raw !== '';
      const hasNote = r.note.trim() !== '';

      let valueNumeric: number | null = null;
      let valueText: string | null = null;

      if (hasValue) {
        if (ind.data_type === 'number' || ind.data_type === 'percentage') {
          const normalized = raw.replace(',', '.');
          valueNumeric = Number(normalized);
        } else {
          valueText = raw;
        }
      }

      // Chỉ thêm nếu có giá trị/ghi chú, hoặc nếu trước đó đã có bản ghi trong initialValues cần cập nhật/xóa
      const existedInDb = initialValues.some((v) => v.indicator_id === ind.id);
      if (hasValue || hasNote || existedInDb) {
        items.push({
          indicatorId: ind.id,
          valueNumeric,
          valueText,
          note: hasNote ? r.note.trim() : null,
        });
      }
    }

    startTransition(async () => {
      const res = await saveReportValuesAction({
        reportId: report.id,
        items,
      });

      if (!res.success) {
        setFeedback({
          type: 'error',
          message: res.error,
        });
      } else {
        setFeedback({
          type: 'success',
          message: `Đã lưu nháp dữ liệu thành công (${res.count} chỉ tiêu) lúc ${res.savedAt}.`,
        });
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header báo cáo & Metadata */}
      <div className="panel">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--card-border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span className={statusInfo.badgeClass}>{statusInfo.label}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Mã báo cáo: {report.id.substring(0, 8)}...
                </span>
              </div>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {report.title}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                <div>
                  <strong>Đơn vị:</strong> {report.departments?.name || 'Chưa xác định'}
                </div>
                <div>·</div>
                <div>
                  <strong>Năm:</strong> {report.year}
                </div>
                <div>·</div>
                <div>
                  <strong>Kỳ:</strong> Cả năm
                </div>
              </div>
            </div>

            {/* Quick Actions Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--card-border)',
                  background: '#ffffff',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                &larr; Tổng quan
              </Link>

              {isEditable && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    background: isPending ? '#93c5fd' : 'var(--color-primary)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  {isPending ? (
                    <>
                      <svg
                        style={{ animation: 'spin 1s linear infinite', width: '14px', height: '14px' }}
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
                        <path
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          fill="currentColor"
                        />
                      </svg>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M13 15H3a2 2 0 01-2-2V3a2 2 0 012-2h7l4 4v9a2 2 0 01-2 2z" />
                        <path d="M11 15v-5H5v5" />
                        <path d="M5 1v3h5" />
                      </svg>
                      <span>Lưu nháp</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Thông báo kết quả lưu nháp (non-blocking notification) */}
        {feedback && (
          <div
            style={{
              padding: '12px 24px',
              borderBottom: '1px solid var(--card-border)',
              background: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
              color: feedback.type === 'success' ? '#166534' : '#dc2626',
              fontSize: '13.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{feedback.type === 'success' ? '✓' : '⚠️'}</span>
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'currentColor',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '0 4px',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Cảnh báo chế độ chỉ đọc nếu trạng thái không phải draft/rejected */}
        {!isEditable && (
          <div
            style={{
              padding: '12px 24px',
              borderBottom: '1px solid #fed7aa',
              background: '#fff7ed',
              color: '#c2410c',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>🔒</span>
            <span>
              Báo cáo này hiện ở trạng thái <strong>{statusInfo.label}</strong> ({statusInfo.desc}). Dữ liệu chỉ có thể xem, không thể chỉnh sửa.
            </span>
          </div>
        )}

        {/* Thanh công cụ tìm kiếm và tiến độ */}
        <div
          style={{
            padding: '12px 24px',
            background: '#fafbfc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px', maxWidth: '420px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                placeholder="Tìm theo mã hoặc tên chỉ tiêu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 32px',
                  borderRadius: '6px',
                  border: '1px solid var(--card-border)',
                  background: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                }}
              >
                🔍
              </span>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <div>
              Tiến độ nhập: <strong>{filledCount}</strong> / {indicators.length} chỉ tiêu
            </div>
            {indicators.length > 0 && (
              <div
                style={{
                  width: '90px',
                  height: '6px',
                  borderRadius: '3px',
                  background: '#e2e8f0',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.round((filledCount / indicators.length) * 100)}%`,
                    height: '100%',
                    background: 'var(--color-primary)',
                    transition: 'width 0.2s',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bảng danh sách chỉ tiêu và nhập liệu */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Danh sách chỉ tiêu số liệu</div>
          <div className="panel-subtitle">
            Nhập số liệu thực hiện cho các chỉ tiêu được giao của đơn vị
          </div>
        </div>

        {indicators.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📋</div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
              Chưa có chỉ tiêu nào được gán cho đơn vị này
            </div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>
              Vui lòng liên hệ quản trị viên để cấu hình danh mục chỉ tiêu cho phòng ban.
            </div>
          </div>
        ) : filteredIndicators.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div>Không tìm thấy chỉ tiêu nào phù hợp với từ khóa &ldquo;{search}&rdquo;.</div>
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{
                marginTop: '10px',
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid var(--card-border)',
                background: '#ffffff',
                fontSize: '12.5px',
                cursor: 'pointer',
              }}
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Mã chỉ tiêu</th>
                  <th style={{ minWidth: '260px' }}>Tên chỉ tiêu</th>
                  <th style={{ width: '110px' }}>Đơn vị tính</th>
                  <th style={{ width: '180px' }}>Số liệu</th>
                  <th style={{ minWidth: '200px' }}>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {filteredIndicators.map((ind) => {
                  const state = rows[ind.id] || { value: '', note: '' };
                  const isNumeric = ind.data_type === 'number' || ind.data_type === 'percentage';

                  return (
                    <tr key={ind.id}>
                      {/* Mã chỉ tiêu */}
                      <td>
                        <span className="badge badge-gray" style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {ind.code}
                        </span>
                      </td>

                      {/* Tên chỉ tiêu */}
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{ind.name}</div>
                        {ind.description && (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {ind.description}
                          </div>
                        )}
                      </td>

                      {/* Đơn vị tính */}
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {ind.unit || '—'}
                        </span>
                      </td>

                      {/* Giá trị nhập */}
                      <td>
                        <input
                          type={isNumeric ? 'number' : 'text'}
                          step={isNumeric ? 'any' : undefined}
                          value={state.value}
                          onChange={(e) => handleValueChange(ind.id, e.target.value)}
                          disabled={!isEditable || isPending}
                          placeholder={isNumeric ? '0.00' : 'Nhập giá trị...'}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--card-border)',
                            background: isEditable ? '#ffffff' : '#f8fafc',
                            fontSize: '13.5px',
                            fontFamily: isNumeric ? 'monospace' : 'inherit',
                            color: 'var(--text-primary)',
                            outline: 'none',
                          }}
                        />
                      </td>

                      {/* Ghi chú */}
                      <td>
                        <input
                          type="text"
                          value={state.note}
                          onChange={(e) => handleNoteChange(ind.id, e.target.value)}
                          disabled={!isEditable || isPending}
                          placeholder="Ghi chú (nếu có)..."
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--card-border)',
                            background: isEditable ? '#ffffff' : '#f8fafc',
                            fontSize: '13px',
                            color: 'var(--text-primary)',
                            outline: 'none',
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer actions */}
        {isEditable && indicators.length > 0 && (
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid var(--card-border)',
              background: '#fafbfc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 22px',
                borderRadius: '6px',
                border: 'none',
                background: isPending ? '#93c5fd' : 'var(--color-primary)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isPending ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {isPending ? 'Đang lưu...' : 'Lưu nháp dữ liệu'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
