import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../intake/tag.html', import.meta.url), 'utf8');
const form = html.match(/<form\b[^>]*id="tag-form"[\s\S]*?<\/form>/)[0];
const controls = [...form.matchAll(/<(?:input|textarea|select)\b[^>]*>/g)].map(([tag]) => ({
  name: tag.match(/\bname="([^"]+)"/)?.[1],
  type: tag.match(/\btype="([^"]+)"/)?.[1],
  value: tag.match(/\bvalue="([^"]*)"/)?.[1],
  required: /\srequired(?:\s|>)/.test(tag),
  disabled: /\sdisabled(?:\s|>)/.test(tag),
}));
const expected = ['_redirect', '_append', 'tag_type', 'customer_name', 'customer_email',
  'customer_address', 'summary', 'business_name', 'business_address', 'owner_first_name',
  'owner_last_name', 'owner_address', 'driver_first_name', 'driver_last_name', 'driver_address'];

test('Tag native POST exposes only the retained fields, with no license or upload control', () => {
  assert.deepEqual([...new Set(controls.map(x => x.name))], expected);
  assert.ok(controls.every(x => x.type !== 'file'));
  assert.doesNotMatch(form, /(?:name|id)="[^"]*(?:license|licence)[^"]*"/i);
});

test('all three Tag selections retain the existing Formspark POST and redirect', () => {
  assert.match(form, /action="https:\/\/submit-form.com\/Pg36aKa8d"/);
  assert.match(form, /method="POST"/);
  assert.deepEqual(controls.filter(x => x.name === 'tag_type').map(x => x.value),
    ['transport-tag', 'paper-tag', 'tag-transfer']);
  assert.equal(controls.find(x => x.name === '_redirect').value, 'https://lbtitle.co/success.html');
  assert.equal(controls.find(x => x.name === '_append').value, 'false');
});

test('native required-field, email and single-service selection constraints remain intact', () => {
  assert.ok(controls.every(x => !x.disabled));
  assert.ok(controls.filter(x => x.type !== 'hidden').every(x => x.required));
  assert.equal(controls.find(x => x.name === 'customer_email').type, 'email');
  assert.ok(controls.filter(x => x.name === 'tag_type').every(x => x.type === 'radio'));
  assert.doesNotMatch(form, /\bnovalidate\b|\bformnovalidate\b|\bonsubmit\s*=/i);
  assert.match(form, /<button\s+type="submit"/);
});

test('synthetic successful-control payloads contain no license identifiers for any Tag service', () => {
  // Models native successful controls; no network request or provider access.
  for (const service of ['transport-tag', 'paper-tag', 'tag-transfer']) {
    const body = new URLSearchParams();
    for (const control of controls) {
      if (control.type === 'radio' && control.value !== service) continue;
      body.append(control.name, control.value ?? (control.name === 'customer_email'
        ? 'synthetic@example.invalid' : 'Synthetic request'));
    }
    assert.deepEqual([...body.keys()], expected);
    assert.equal(body.get('tag_type'), service);
    assert.equal(body.has('driver_license_number'), false);
    assert.equal(body.has('driver_license_state'), false);
  }
});

test('initial intake warns against identification in free text and explains later paperwork needs', () => {
  assert.match(form, /Do not include driver's-license numbers/);
  assert.match(form, /including the\s+request description/);
  assert.match(form, /Additional identification may be required later\s+to complete your Tag paperwork/);
});
