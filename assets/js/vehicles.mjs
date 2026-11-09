import { readSnapshot, visibleVehicles, showroomVehicles, advancePhoto } from './vehicle-contract.mjs';
const $ = id => document.getElementById(id);
const node = (tag, text, props = {}) => Object.assign(document.createElement(tag), { textContent: text, ...props });
const action = (text, fn) => { const b = node('button', text, { type: 'button' }); b.addEventListener('click', fn); return b; };
const link = (text, href) => node('a', text, { href });
const title = v => `${v.year} ${v.make} ${v.model}`;
const price = v => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(v.price);
let snapshot = null, revision = -1, local = false, position = { vehicle: 0, photo: 0 }, busy = false;
const failedPhotos = new Set(), photoChecks = new Map();
let visibleIds = '';
const eligibleShowroom = () => showroomVehicles(snapshot).filter(v => !failedPhotos.has(v.id) && v.photos.every(p => photoChecks.get(p.url) === 'loaded'));
function probePhotos() { for (const v of showroomVehicles(snapshot))
    for (const photo of v.photos) {
        if (photoChecks.has(photo.url))
            continue;
        photoChecks.set(photo.url, 'loading');
        const img = new Image();
        img.onload = () => { if (img.naturalWidth > 0 && img.naturalHeight > 0)
            photoChecks.set(photo.url, 'loaded');
        else
            failedPhotos.add(v.id); renderShowroom(); };
        img.onerror = () => { failedPhotos.add(v.id); photoChecks.set(photo.url, 'failed'); renderShowroom(); };
        img.src = photo.url;
    } }
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let paused = motion.matches, homeActive = location.hash === '#home' || !location.hash;
const home = document.querySelector('[data-room="home"]');
const showroom = node('div', '', { className: 'home-showroom', hidden: true });
home.append(showroom);
const selectedId = () => new URL(location.href).searchParams.get('vehicle');
function current(id) { return visibleVehicles(snapshot).find(v => v.id === id); }
function fresh() { const wasFresh = !!snapshot?.fresh; if (snapshot && Date.now() >= Date.parse(snapshot.expiresAt))
    snapshot = { ...snapshot, fresh: false }; const ids = visibleVehicles(snapshot).map(v => v.id).join(','); if (ids !== visibleIds || wasFresh !== !!snapshot?.fresh) {
    render();
} return !!snapshot?.fresh; }
function openDetail(id) { if (!fresh() || !current(id))
    return; const url = new URL(location.href); url.searchParams.set('vehicle', id); url.hash = 'vehicles'; history.replaceState(null, '', url); document.querySelector('[data-room-target="vehicles"]').click(); renderDetail(id); $('vehicle-detail').scrollIntoView({ block: 'nearest' }); }
function contactActions(v, allowInquiry = true) {
    const box = node('div', '', { className: 'vehicle-actions' });
    box.append(link('Call LB', 'tel:+13054826302'), link('Text LB', `sms:+13054826302?body=${encodeURIComponent(`Ask LB about vehicle ${v.id} (${v.sellerCategory}). Please confirm availability.`)}`));
    if (local && allowInquiry && v.availability === 'AVAILABLE')
        box.append(action('Ask About This Vehicle — local test', () => { if (fresh() && current(v.id)?.availability === 'AVAILABLE')
            requestForm('inquiry', v); }));
    return box;
}
function renderDetail(id = selectedId()) {
    const box = $('vehicle-detail');
    box.replaceChildren();
    const v = current(id);
    box.hidden = !v;
    if (!v)
        return;
    box.append(node('h2', title(v)), node('p', `${price(v)} · ${v.mileage.toLocaleString()} miles · ${v.availability}`), node('p', `${v.sellerCategory === 'COMMUNITY' ? 'Community seller — coordinated by LB' : 'Low Budget Auto Sale inventory'}. Condition: ${v.condition}. Title statement: ${v.titleStatus}. Seller-provided, not independently certified.`), node('p', v.description));
    for (const photo of v.photos)
        box.append(node('img', '', { src: photo.url, alt: photo.alt, loading: 'lazy' }));
    box.append(node('p', `Recorded ${v.updatedAt}. Call to confirm availability.`), contactActions(v));
}
function renderShowroom() {
    const focusedIndex = [...showroom.querySelectorAll('button,a')].indexOf(document.activeElement);
    const list = eligibleShowroom();
    showroom.replaceChildren();
    showroom.hidden = !list.length;
    if (!list.length) {
        showroom.style.backgroundImage = '';
        return;
    }
    if (!list[position.vehicle])
        position = { vehicle: 0, photo: 0 };
    const v = list[position.vehicle];
    if (!v.photos[position.photo])
        position.photo = 0;
    showroom.style.backgroundImage = `url("${v.photos[position.photo].url}")`;
    showroom.setAttribute('aria-label', v.photos[position.photo].alt);
    const panel = node('div', '', { className: 'showroom-panel' });
    panel.append(node('h2', title(v)), node('p', `${price(v)} · ${v.mileage.toLocaleString()} miles · ${v.availability}`), node('p', 'Call to confirm availability.'), node('p', `Photo ${position.photo + 1} of ${v.photos.length} · Vehicle ${position.vehicle + 1} of ${list.length}`));
    const controls = node('div', '', { className: 'vehicle-actions' });
    controls.append(action('Previous', () => advance(-1)), action('Next', () => advance(1)), action(paused ? 'Resume slideshow' : 'Pause slideshow', () => { paused = !paused; renderShowroom(); }), action('View Details', () => openDetail(v.id)));
    panel.append(controls, contactActions(v, false));
    showroom.append(panel);
    if (focusedIndex >= 0)
        showroom.querySelectorAll('button,a')[focusedIndex]?.focus({ preventScroll: true });
}
function advance(delta) { if (!fresh())
    return; position = advancePhoto(eligibleShowroom(), position, delta) || { vehicle: 0, photo: 0 }; renderShowroom(); }
function render() {
    const grid = $('vehicle-grid');
    grid.replaceChildren();
    const list = visibleVehicles(snapshot);
    visibleIds = list.map(v => v.id).join(',');
    $('vehicle-state').textContent = !snapshot ? 'Inventory unavailable. Please call or text LB.' : snapshot.vehicles.length === 0 ? 'No vehicles currently available.' : !snapshot.fresh ? 'Inventory review overdue. Please call or text LB for current vehicles.' : list.length ? (snapshot.schema === 'lb.inventory/static-v1' ? `Owner-reviewed ${snapshot.generatedAt}. This is not live availability; call or text to confirm before traveling. Review due ${snapshot.expiresAt}.` : `Recorded inventory revision ${snapshot.revision}. Expires ${snapshot.expiresAt}. Call to confirm availability.`) : 'No vehicles currently available.';
    for (const v of list) {
        const card = node('article', '', { className: 'vehicle-card' });
        card.append(node('img', '', { src: v.photos[0].url, alt: v.photos[0].alt, loading: 'lazy' }), node('h2', title(v)), node('p', `${price(v)} · ${v.mileage.toLocaleString()} miles · ${v.availability}`), action('View Details', () => openDetail(v.id)));
        grid.append(card);
    }
    renderDetail();
    probePhotos();
    renderShowroom();
    const inquiry = $('vehicle-request').querySelector('[data-kind="inquiry"]');
    if (inquiry && (!snapshot?.fresh || current(inquiry.dataset.vehicleId)?.availability !== 'AVAILABLE'))
        $('vehicle-request').replaceChildren(node('p', 'Inventory expired or vehicle unavailable. Please refresh before asking about a vehicle.'));
}
async function refresh() { if (busy)
    return; busy = true; try {
    const r = await fetch(`/assets/data/vehicles.json?review=${Date.now()}`, { cache: 'no-store', credentials: 'omit' });
    if (!r.ok)
        throw Error('Unavailable');
    snapshot = readSnapshot(await r.json(), Date.now(), revision);
    revision = snapshot.revision;
}
catch {
    snapshot = null;
}
finally {
    busy = false;
    render();
} }
async function requestForm(kind, v) {
    if (!local)
        return;
    const form = node('form', '', { className: 'vehicle-form' });
    form.dataset.kind = kind;
    if (kind === 'inquiry')
        form.dataset.vehicleId = v.id;
    form.append(node('h2', kind === 'community' ? 'Sell Your Car — synthetic submission' : kind === 'finding' ? 'Find Me a Car — synthetic request' : `Inquiry: ${title(v)}`), node('p', 'Synthetic information only. Do not submit IDs, documents, financing or payment information. This is not a live service.'));
    const fields = {};
    const field = (key, label, type = 'text', required = true, max = 200) => { const wrap = node('label', label); const input = node(type === 'textarea' ? 'textarea' : 'input', '', { name: key, required, maxLength: max }); if (type !== 'textarea')
        input.type = type; if (type === 'number') {
        input.min = '0';
        input.step = '1';
    } wrap.append(input); form.append(wrap); fields[key] = input; return input; };
    if (kind === 'finding')
        for (const [key, label, type] of [['make', 'Desired make'], ['model', 'Desired model'], ['yearMin', 'Earliest year', 'number'], ['yearMax', 'Latest year', 'number'], ['budgetMin', 'Minimum budget', 'number'], ['budgetMax', 'Maximum budget', 'number'], ['bodyStyle', 'Body style'], ['mileagePreference', 'Mileage preference']])
            field(key, label, type || 'text', type === 'number', key === 'make' ? 60 : key === 'model' ? 80 : 200);
    if (kind === 'community')
        for (const [key, label, type] of [['year', 'Year', 'number'], ['make', 'Make'], ['model', 'Model'], ['mileage', 'Mileage', 'number'], ['price', 'Asking price (whole dollars)', 'number'], ['condition', 'Condition (seller statement)'], ['titleStatus', 'Title information (seller statement)'], ['description', 'Description', 'textarea']])
            field(key, label, type || 'text', true, ({ make: 60, model: 80, condition: 160, titleStatus: 160, description: 2000 })[key] || 200);
    field('name', 'Synthetic contact name');
    field('email', 'Synthetic email — email or phone required', 'email', false);
    field('phone', 'Synthetic phone — email or phone required', 'tel', false);
    field('notes', 'Notes — no sensitive information', 'textarea', false, 2000);
    let photosInput;
    if (kind === 'community') {
        photosInput = field('photos', 'Synthetic vehicle photos only', 'file');
        photosInput.multiple = true;
        photosInput.accept = 'image/jpeg,image/png,image/webp';
        for (const [key, label] of [['consent', 'I have permission to submit these photos and request public display of approved vehicle information.'], ['acknowledgment', 'I understand LB review is required and approval is not ownership/title verification; my contact information stays private.']])
            field(key, label, 'checkbox');
    }
    const status = node('p', '', { role: 'status' });
    const submit = node('button', 'Send synthetic request', { type: 'submit' });
    form.append(submit, status);
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!local || !form.reportValidity())
            return;
        submit.disabled = true;
        status.textContent = 'Sending synthetic request…';
        try {
            const contact = { name: fields.name.value, email: fields.email.value, phone: fields.phone.value };
            let payload = { type: kind, contact, notes: fields.notes.value };
            if (!contact.email.trim() && !contact.phone.trim())
                throw Error('Provide a synthetic email or phone number.');
            if (kind === 'inquiry') {
                if (!fresh() || current(v.id)?.availability !== 'AVAILABLE')
                    throw Error('Inventory is no longer actionable. Refresh and contact LB.');
                payload = { ...payload, vehicleId: v.id, sellerCategory: v.sellerCategory };
            }
            if (kind === 'finding')
                for (const key of ['make', 'model', 'yearMin', 'yearMax', 'budgetMin', 'budgetMax', 'bodyStyle', 'mileagePreference']) {
                    if (fields[key].value)
                        payload[key] = fields[key].type === 'number' ? Number(fields[key].value) : fields[key].value;
                }
            if (kind === 'community') {
                if (photosInput.files.length < 1 || photosInput.files.length > 12)
                    throw Error('Choose 1–12 synthetic photos.');
                const photos = [];
                for (const file of photosInput.files) {
                    if (file.size > 8 * 1024 * 1024)
                        throw Error('Each photo must be at most 8 MB.');
                    const uploaded = await fetch('/api/vehicle-photos', { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
                    if (!uploaded.ok)
                        throw Error('Photo was rejected.');
                    photos.push(await uploaded.json());
                }
                const vehicle = { sellerCategory: 'COMMUNITY', availability: 'AVAILABLE', publication: 'DRAFT', approved: false, photos };
                for (const key of ['year', 'make', 'model', 'mileage', 'price', 'condition', 'titleStatus', 'description'])
                    vehicle[key] = fields[key].type === 'number' ? Number(fields[key].value) : fields[key].value;
                payload = { ...payload, vehicle, consent: fields.consent.checked, acknowledgment: fields.acknowledgment.checked };
            }
            const response = await fetch('/api/vehicle-requests', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(payload) });
            if (!response.ok)
                throw Error(`Request rejected (${response.status}). No live request was sent.`);
            status.textContent = 'Synthetic request received by the local Operator Desk. No listing was published.';
            form.reset();
        }
        catch (error) {
            status.textContent = error.message || 'Request unavailable.';
        }
        finally {
            submit.disabled = false;
        }
    });
    $('vehicle-request').replaceChildren(form);
    form.querySelector('input')?.focus();
}
$('vehicle-refresh').addEventListener('click', refresh);
addEventListener('focus', refresh);
document.addEventListener('visibilitychange', () => { if (!document.hidden)
    refresh(); });
document.addEventListener('lb:roomchange', event => { homeActive = event.detail.roomName === 'home'; });
motion.addEventListener('change', () => { if (motion.matches)
    paused = true; renderShowroom(); });
setInterval(() => { fresh(); if (homeActive && !paused && !document.hidden && !showroom.contains(document.activeElement))
    advance(1); }, 9000);
setInterval(fresh, 1000);
// Static owner updates are re-read while a customer keeps the page open.
setInterval(() => { if (!document.hidden) refresh(); }, 60000);
if (['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) {
    try {
        const response = await fetch('/api/local-capabilities', { cache: 'no-store' });
        const capabilities = await response.json();
        local = response.ok && capabilities.synthetic === true && capabilities.customerIntake !== false;
    }
    catch {
        local = false;
    }
}
$('vehicle-local').hidden = !local;
$('open-finding').addEventListener('click', () => requestForm('finding'));
$('open-community').addEventListener('click', () => requestForm('community'));
await refresh();
