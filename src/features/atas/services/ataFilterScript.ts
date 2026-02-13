/**
 * Script de filtros da ata - implementação robusta com data-attributes.
 * Filtra linhas de itens por descrição, responsável, data e status.
 */
export function getAtaFilterScript(): string {
  return `(function(){
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  var bar = document.createElement('div');
  bar.id = 'ata-filter-bar';
  bar.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#007e7a;color:#fff;padding:12px 16px;z-index:9999;display:flex;flex-wrap:wrap;gap:10px;align-items:center;font-family:Segoe UI,Arial,sans-serif;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.2);';
  bar.innerHTML = '<div style="font-weight:bold;margin-right:8px;">🔍 Filtros</div>' +
    '<label style="display:flex;align-items:center;background:#005f5c;padding:6px 12px;border-radius:4px;cursor:pointer;white-space:nowrap;"><input type="checkbox" id="ata-filt-open" style="margin-right:6px;">Apenas Pendentes</label>' +
    '<input type="text" id="ata-filt-desc" placeholder="Descrição ou Item" style="padding:6px 10px;border:none;border-radius:4px;width:180px;">' +
    '<input type="text" id="ata-filt-resp" placeholder="Responsável" style="padding:6px 10px;border:none;border-radius:4px;width:140px;">' +
    '<input type="text" id="ata-filt-data" placeholder="Data" style="padding:6px 10px;border:none;border-radius:4px;width:100px;">' +
    '<select id="ata-filt-status" style="padding:6px 10px;border:none;border-radius:4px;"><option value="">Todos</option><option value="Concluído">Concluído</option><option value="Pendente">Pendente</option><option value="Em andamento">Em Andamento</option><option value="Cancelado">Cancelado</option><option value="Info">Info</option></select>' +
    '<button id="ata-filt-clear" style="padding:6px 14px;border:none;border-radius:4px;background:#ad2a23;color:#fff;cursor:pointer;font-weight:bold;">Limpar</button>';

  document.body.insertBefore(bar, document.body.firstChild);
  document.body.style.paddingTop = '56px';

  function norm(s) {
    if (!s) return '';
    return String(s).toLowerCase().replace(/\\s+/g, '').replace(/[àáâãä]/g,'a').replace(/[èéêë]/g,'e').replace(/[ìíîï]/g,'i').replace(/[òóôõö]/g,'o').replace(/[ùúûü]/g,'u').replace(/ç/g,'c');
  }

  function apply() {
    var desc = norm(document.getElementById('ata-filt-desc').value);
    var resp = norm(document.getElementById('ata-filt-resp').value);
    var data = norm(document.getElementById('ata-filt-data').value);
    var status = norm(document.getElementById('ata-filt-status').value);
    var open = document.getElementById('ata-filt-open').checked;
    var active = !!desc || !!resp || !!data || !!status || open;

    var rows = document.querySelectorAll('[data-ata-item-row]');
    var idToPai = {};
    rows.forEach(function(tr) {
      var id = tr.getAttribute('data-ata-id');
      var pai = tr.getAttribute('data-ata-pai') || '';
      if (id) idToPai[id] = pai;
    });
    var idsToShow = new Set();
    rows.forEach(function(tr) {
      var isParent = tr.getAttribute('data-ata-parent') === '1';
      var show = true;
      var d = tr.getAttribute('data-ata-desc') || '';
      if (desc && norm(d).indexOf(desc) === -1) show = false;
      if (!isParent) {
        var r = tr.getAttribute('data-ata-resp') || '';
        var dt = tr.getAttribute('data-ata-date') || '';
        var st = tr.getAttribute('data-ata-status') || '';
        if (resp && norm(r).indexOf(resp) === -1) show = false;
        if (data && norm(dt).indexOf(data) === -1) show = false;
        if (status && norm(st).indexOf(status) === -1) show = false;
        if (open && /conclu[ií]do|info|cancelado/.test(norm(st))) show = false;
      }
      if (show) {
        var id = tr.getAttribute('data-ata-id');
        if (id) {
          idsToShow.add(id);
          var cur = id;
          while (idToPai[cur]) {
            idsToShow.add(idToPai[cur]);
            cur = idToPai[cur];
          }
        }
      }
    });
    rows.forEach(function(tr) {
      var id = tr.getAttribute('data-ata-id');
      tr.style.display = (!active || (id && idsToShow.has(id))) ? '' : 'none';
    });

    document.querySelectorAll('[data-ata-section]').forEach(function(el) {
      el.style.display = active ? 'none' : '';
    });
    document.getElementById('ata-content').style.minHeight = active ? 'auto' : '100vh';
  }

  ['ata-filt-desc','ata-filt-resp','ata-filt-data','ata-filt-status'].forEach(function(id) {
    document.getElementById(id).addEventListener('input', apply);
    document.getElementById(id).addEventListener('change', apply);
  });
  document.getElementById('ata-filt-open').addEventListener('change', apply);
  document.getElementById('ata-filt-clear').addEventListener('click', function() {
    document.getElementById('ata-filt-desc').value = '';
    document.getElementById('ata-filt-resp').value = '';
    document.getElementById('ata-filt-data').value = '';
    document.getElementById('ata-filt-status').value = '';
    document.getElementById('ata-filt-open').checked = false;
    apply();
  });
})();`
}
