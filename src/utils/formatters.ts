export function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/[&<>]/g, (m) => {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

export function getRemarksBadge(remarks: string): string {
  if (remarks === 'COMPLETED') {
    return '<span class="badge badge-ok">✓ Completed</span>';
  } else if (remarks === 'PENDING') {
    return '<span class="badge badge-pd">⏳ Pending</span>';
  } else if (remarks === 'NOT COMPLETED') {
    return '<span class="badge badge-no">✗ Not Done</span>';
  } else if (remarks === 'CONTINUOUS TRAINING') {
    return '<span class="badge badge-ct">↻ Cont. Training</span>';
  }
  return '<span class="badge">' + remarks + '</span>';
}

export function getEndorsementTag(endorsement: string): string {
  if (endorsement && endorsement.includes('OJT')) {
    return '<span class="etag etag-hk">✈️ OJT-HK</span>';
  } else if (endorsement && endorsement.includes('Continuing')) {
    return '<span class="etag etag-os">🔄 Cont. OS</span>';
  } else if (endorsement && endorsement.includes('Not Continuing')) {
    return '<span class="etag etag-no">✗ Not Cont.</span>';
  } else if (endorsement && endorsement.includes('Graduate')) {
    return '<span class="etag etag-grad">🎓 Grad</span>';
  }
  return '<span class="etag">' + (endorsement || '') + '</span>';
}

export function getDutiesTag(duties: string): string {
  if (duties === 'Regular Duty Assigned') {
    return '<span class="dtag dtag-reg">📋 Regular</span>';
  } else if (duties === 'Advance Duties') {
    return '<span class="dtag dtag-adv">⭐ Advance</span>';
  } else if (duties === 'No Longer with OS') {
    return '<span class="dtag dtag-none">🚫 No Longer</span>';
  } else if (duties === 'NO GC Assignment') {
    return '<span class="dtag dtag-nogc">📵 No GC</span>';
  }
  return '<span class="dtag">' + duties + '</span>';
}