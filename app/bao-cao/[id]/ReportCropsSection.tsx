'use client';

import { useState, useTransition } from 'react';
import { saveReportCropsAction } from './crop-actions';
import { useRouter } from 'next/navigation';

export type LocationItem = {
id: string;
name: string;
level?: string;
};

export type ReportCropItem = {
id?: string;
report_id?: string;
location_id: string;
crop_type: string;
planned_area: number | null;
planted_area: number | null;
harvested_area: number | null;
yield: number | null;
unit: string;
};

type Props = {
reportId: string;
status: string;
locations: LocationItem[];
initialData: ReportCropItem[];
};

export function ReportCropsSection({ reportId, status, locations, initialData }: Props) {
const router = useRouter();
const isEditable = status === 'draft';

const [items, setItems] = useState<ReportCropItem[]>(initialData || []);
const [isPending, startTransition] = useTransition();
const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

const handleAddRow = () => {
setItems((prev) => [
...prev,
{
location_id: '',
crop_type: '',
planned_area: null,
planted_area: null,
harvested_area: null,
yield: null,
unit: '',
},
]);
};

const handleRemoveRow = (index: number) => {
setItems((prev) => prev.filter((_, i) => i !== index));
};

const handleChange = (index: number, field: keyof ReportCropItem, value: any) => {
setItems((prev) => {
const newItems = [...prev];
newItems[index] = { ...newItems[index], [field]: value };
return newItems;
});
};

const handleSave = () => {
setMessage(null);
startTransition(async () => {
const result = await saveReportCropsAction(reportId, items);
  if (result.success) {
    setMessage({
      type: 'success',
      text: 'Lưu dữ liệu Trồng trọt thành công!',
    });
    router.refresh();
  } else {
    setMessage({
      type: 'error',
      text: result.error || 'Lỗi khi lưu dữ liệu.',
    });
  }
});
};

const parseNumberInput = (val: string) => {
if (!val) return null;
const standardized = val.replace(/,/g, '.');
const parsed = parseFloat(standardized);

if (isNaN(parsed) || !isFinite(parsed)) return null;

return parsed;
};

const fieldStyle: React.CSSProperties = {
width: '100%',
padding: '8px 9px',
minHeight: '36px',
borderRadius: '5px',
border: '1.5px solid #94a3b8',
backgroundColor: '#f8fafc',
boxSizing: 'border-box',
};

const numberFieldStyle: React.CSSProperties = {
...fieldStyle,
textAlign: 'right',
};

return (
<div className="panel" style={{ marginTop: '24px' }}>
<div
className="panel-header"
style={{
display: 'flex',
justifyContent: 'space-between',
alignItems: 'center',
}}
> <h2 className="panel-title">Trồng trọt & BVTV</h2>
    {isEditable && (
      <button
        onClick={handleAddRow}
        className="btn-secondary"
        style={{
          padding: '6px 12px',
          fontSize: '13px',
        }}
      >
        + Thêm dòng
      </button>
    )}
  </div>

  <div className="panel-body">
    {message && (
      <div
        className={message.type === 'success' ? 'alert-success' : 'alert-error'}
        style={{ marginBottom: '16px' }}
      >
        {message.text}
      </div>
    )}

    {items.length === 0 ? (
      <div
        style={{
          padding: '24px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
        }}
      >
        Chưa có dữ liệu Trồng trọt. Bấm "Thêm dòng" để bắt đầu nhập.
      </div>
    ) : (
      <div style={{ overflowX: 'auto' }}>
        <table
          className="data-table"
          style={{
            width: '100%',
            minWidth: '800px',
            borderCollapse: 'collapse',
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                Địa bàn
              </th>

              <th
                style={{
                  textAlign: 'left',
                  padding: '8px',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                Cây trồng
              </th>

              <th
                style={{
                  textAlign: 'right',
                  padding: '8px',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                DT Kế hoạch
              </th>

              <th
                style={{
                  textAlign: 'right',
                  padding: '8px',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                DT Gieo trồng
              </th>

              <th
                style={{
                  textAlign: 'right',
                  padding: '8px',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                DT Thu hoạch
              </th>

              <th
                style={{
                  textAlign: 'right',
                  padding: '8px',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                Năng suất
              </th>

              <th
                style={{
                  textAlign: 'left',
                  padding: '8px',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                Đơn vị
              </th>

              {isEditable && (
                <th
                  style={{
                    width: '60px',
                    padding: '8px',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                />
              )}

              </tr>
            </thead>

            <tbody>
              {items.map((row, idx) => (
                <tr key={idx}>
                  <td
                    style={{
                      padding: '8px',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <select
                      value={row.location_id}
                      onChange={(e) =>
                        handleChange(idx, 'location_id', e.target.value)
                      }
                      disabled={!isEditable}
                      style={fieldStyle}
                    >
                      <option value="">-- Chọn địa bàn --</option>

                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td
                    style={{
                      padding: '8px',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <input
                      type="text"
                      value={row.crop_type}
                      onChange={(e) =>
                        handleChange(idx, 'crop_type', e.target.value)
                      }
                      disabled={!isEditable}
                      placeholder="Tên cây trồng"
                      style={fieldStyle}
                    />
                  </td>

                  <td
                    style={{
                      padding: '8px',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <input
                      type="text"
                      value={row.planned_area === null ? '' : row.planned_area}
                      onChange={(e) =>
                        handleChange(
                          idx,
                          'planned_area',
                          parseNumberInput(e.target.value)
                        )
                      }
                      disabled={!isEditable}
                      placeholder="0"
                      style={numberFieldStyle}
                    />
                  </td>

                  <td
                    style={{
                      padding: '8px',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <input
                      type="text"
                      value={row.planted_area === null ? '' : row.planted_area}
                      onChange={(e) =>
                        handleChange(
                          idx,
                          'planted_area',
                          parseNumberInput(e.target.value)
                        )
                      }
                      disabled={!isEditable}
                      placeholder="0"
                      style={numberFieldStyle}
                    />
                  </td>

                  <td
                    style={{
                      padding: '8px',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <input
                      type="text"
                      value={row.harvested_area === null ? '' : row.harvested_area}
                      onChange={(e) =>
                        handleChange(
                          idx,
                          'harvested_area',
                          parseNumberInput(e.target.value)
                        )
                      }
                      disabled={!isEditable}
                      placeholder="0"
                      style={numberFieldStyle}
                    />
                  </td>

                  <td
                    style={{
                      padding: '8px',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <input
                      type="text"
                      value={row.yield === null ? '' : row.yield}
                      onChange={(e) =>
                        handleChange(
                          idx,
                          'yield',
                          parseNumberInput(e.target.value)
                        )
                      }
                      disabled={!isEditable}
                      placeholder="0"
                      style={numberFieldStyle}
                    />
                  </td>

                  <td
                    style={{
                      padding: '8px',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <input
                      type="text"
                      value={row.unit}
                      onChange={(e) =>
                        handleChange(idx, 'unit', e.target.value)
                      }
                      disabled={!isEditable}
                      placeholder="ha, tấn..."
                      style={fieldStyle}
                    />
                  </td>

                  {isEditable && (
                    <td
                      style={{
                        padding: '8px',
                        textAlign: 'center',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      <button
                        onClick={() => handleRemoveRow(idx)}
                        className="btn-danger"
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                        }}
                        title="Xóa"
                      >
                        X
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isEditable && items.length > 0 && (
        <div
          style={{
            marginTop: '16px',
            marginBottom: '16px',
            marginRight: '16px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={handleSave}
            disabled={isPending}
            className="btn-primary"
            style={{
              padding: '9px 18px',
              minHeight: '38px',
              border: '1px solid #2563eb',
              borderRadius: '6px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontWeight: 600,
              cursor: isPending ? 'wait' : 'pointer',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
            }}
          >
            {isPending ? 'Đang lưu...' : 'Lưu dữ liệu Trồng trọt'}
          </button>
        </div>
      )}
    </div>
  </div>
);
}





