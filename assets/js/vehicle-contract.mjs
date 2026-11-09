// Public projection only. Never accept contact/private fields into the snapshot.
export const MAX_AGE_MS = 15 * 60 * 1000; // Synthetic qualification bound; owner approval required for launch.
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const text = (x, max) => typeof x === 'string' && x.trim().length > 0 && x.length <= max;
const exact = (o, keys) => o && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).every(k => keys.includes(k)) && keys.every(k => Object.hasOwn(o, k));
const iso = x => typeof x === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(x) && Number.isFinite(Date.parse(x));
export function validVehicle(v) {
    if (!exact(v, ['id', 'sellerCategory', 'year', 'make', 'model', 'mileage', 'price', 'condition', 'titleStatus', 'description', 'photos', 'availability', 'publication', 'approved', 'revision', 'updatedAt']))
        return false;
    return uuid.test(v.id) && ['DEALERSHIP', 'COMMUNITY'].includes(v.sellerCategory) && Number.isInteger(v.year) && v.year >= 1886 && v.year <= new Date().getUTCFullYear() + 1 && text(v.make, 60) && text(v.model, 80) && Number.isInteger(v.mileage) && v.mileage >= 0 && v.mileage <= 2000000 && Number.isInteger(v.price) && v.price >= 0 && v.price <= 10000000 && text(v.condition, 160) && text(v.titleStatus, 160) && text(v.description, 2000) && Array.isArray(v.photos) && v.photos.length >= 1 && v.photos.length <= 12 && v.photos.every(p => exact(p, ['id', 'url', 'alt']) && uuid.test(p.id) && p.url === `/assets/vehicle-photos/${p.id}.webp` && text(p.alt, 160)) && new Set(v.photos.map(p => p.id)).size === v.photos.length && ['AVAILABLE', 'PENDING', 'SOLD'].includes(v.availability) && ['DRAFT', 'PUBLISHED', 'UNPUBLISHED'].includes(v.publication) && typeof v.approved === 'boolean' && Number.isInteger(v.revision) && v.revision >= 1 && iso(v.updatedAt);
}
export function readSnapshot(raw, now = Date.now(), previousRevision = -1) {
    // Explicit owner-reviewed static release; never masquerades as live inventory.
    if (raw?.schema === 'lb.inventory/static-v1') {
        if (!exact(raw, ['schema', 'revision', 'generatedAt', 'expiresAt', 'vehicles']) || !Number.isSafeInteger(raw.revision) || raw.revision < 0 || raw.revision < previousRevision || !iso(raw.generatedAt) || !iso(raw.expiresAt) || !Array.isArray(raw.vehicles) || raw.vehicles.length > 500 || !raw.vehicles.every(v => validVehicle(v) && v.sellerCategory === 'DEALERSHIP' && v.availability === 'AVAILABLE' && v.publication === 'PUBLISHED' && v.approved) || new Set(raw.vehicles.map(v => v.id)).size !== raw.vehicles.length) throw Error('Invalid owner catalog');
        const generated = Date.parse(raw.generatedAt), expires = Date.parse(raw.expiresAt);
        if (generated > now || expires - generated !== 7 * 86400000 || raw.vehicles.some(v => Date.parse(v.updatedAt) > generated)) throw Error('Invalid owner review window');
        return { ...raw, fresh: now < expires };
    }
    if (!exact(raw, ['schema', 'revision', 'generatedAt', 'expiresAt', 'vehicles']) || raw.schema !== 'lb.inventory/v1' || !Number.isInteger(raw.revision) || raw.revision < 0 || raw.revision < previousRevision || !iso(raw.generatedAt) || !iso(raw.expiresAt) || !Array.isArray(raw.vehicles) || raw.vehicles.length > 500 || !raw.vehicles.every(validVehicle) || new Set(raw.vehicles.map(v => v.id)).size !== raw.vehicles.length)
        throw new Error('Inventory unavailable: invalid snapshot.');
    const generated = Date.parse(raw.generatedAt), expires = Date.parse(raw.expiresAt);
    if (generated > now || expires <= generated || expires - generated > MAX_AGE_MS || raw.vehicles.some(v => Date.parse(v.updatedAt) > generated))
        throw new Error('Inventory unavailable: invalid freshness evidence.');
    return { ...raw, fresh: now < expires && now - generated <= MAX_AGE_MS };
}
export const visibleVehicles = (s, now = Date.now()) => s?.fresh && now < Date.parse(s.expiresAt) ? s.vehicles.filter(v => v.publication === 'PUBLISHED' && v.approved && now >= Date.parse(v.updatedAt) && (s.schema === 'lb.inventory/static-v1' ? v.availability === 'AVAILABLE' : now - Date.parse(v.updatedAt) < MAX_AGE_MS)) : [];
export const showroomVehicles = (s, now = Date.now()) => visibleVehicles(s, now).filter(v => v.availability === 'AVAILABLE');
export function advancePhoto(vehicles, position, delta = 1) {
    const frames = vehicles.flatMap((v, vehicle) => v.photos.map((_, photo) => ({ vehicle, photo })));
    if (!frames.length)
        return null;
    let index = frames.findIndex(f => f.vehicle === position?.vehicle && f.photo === position?.photo);
    if (index < 0)
        index = 0;
    return frames[(index + delta + frames.length) % frames.length];
}
