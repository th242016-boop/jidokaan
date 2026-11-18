// Run: node --experimental-strip-types scripts/phone-validation-test.mjs
// Number-plan examples only. No network, customer data, OTP or actual calls.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PHONE_COUNTRY_OPTIONS,
  dialCode,
  fullPhoneNumber,
  localPhoneNumber,
  phoneCountryForNumber,
  validatePhoneNumber,
} from "../src/lib/phone.ts";

// Public numbering-plan examples exercise every currently offered destination.
// Expected E.164 values are explicit, independent of the formatter's output.
const destinations = [
  ["US", "(201) 555-0123", "+12015550123"],
  ["CA", "(506) 234-5678", "+15062345678"],
  ["MX", "222 123 4567", "+522221234567"],
  ["AU", "0412 345 678", "+61412345678"],
  ["JP", "090-1234-5678", "+819012345678"],
  ["CN", "131 2345 6789", "+8613123456789"],
  ["HK", "5123 4567", "+85251234567"],
  ["SG", "8123 4567", "+6581234567"],
  ["TH", "081 234 5678", "+66812345678"],
  ["PH", "0905 123 4567", "+639051234567"],
  ["FR", "06 12 34 56 78", "+33612345678"],
  ["DE", "01512 3456789", "+4915123456789"],
  ["GB", "07400 123456", "+447400123456"],
  ["ES", "612 34 56 78", "+34612345678"],
  ["RU", "8 (912) 345-67-89", "+79123456789"],
  ["BR", "(11) 96123-4567", "+5511961234567"],
  ["AR", "011 15-2345-6789", "+5491123456789"],
  ["EG", "010 01234567", "+201001234567"],
  ["AE", "050 123 4567", "+971501234567"],
  ["SA", "051 234 5678", "+966512345678"],
  ["UZ", "91 234 56 78", "+998912345678"],
  ["TR", "0501 234 56 78", "+905012345678"],
  ["CH", "078 123 45 67", "+41781234567"],
  ["NL", "06 12345678", "+31612345678"],
  ["SE", "070-123 45 67", "+46701234567"],
  ["IN", "081234 56789", "+918123456789"],
  ["KR", "010-2000-0000", "+821020000000"],
];

for (const [country, national, expected] of destinations) {
  test(`${country}: national and explicit international numbers retain the same identity`, () => {
    const result = validatePhoneNumber(national, country);
    assert.equal(result.valid, true);
    assert.equal(result.e164, expected);
    assert.equal(validatePhoneNumber(expected).e164, expected);
    assert.equal(validatePhoneNumber(expected, "HK").e164, expected);
    assert.ok(PHONE_COUNTRY_OPTIONS.some((option) => option.code === country));
  });
}

test("foreign-resident contact is not rewritten to the delivery country's dial code", () => {
  const korean = validatePhoneNumber("+82 10-2000-0000", "US");
  assert.equal(korean.valid, true);
  assert.equal(korean.e164, "+821020000000");
  assert.equal(korean.country, "KR");
  assert.equal(phoneCountryForNumber("+82 10-2000-0000", "US"), "KR");
  assert.equal(localPhoneNumber("+82 10-2000-0000", "US"), "+82 10-2000-0000");
});

test("a significant Italian zero stays while national trunk prefixes use metadata", () => {
  assert.equal(validatePhoneNumber("06 6982", "IT").e164, "+39066982");
  assert.equal(validatePhoneNumber("+39 06 6982", "JP").e164, "+39066982");
  assert.equal(validatePhoneNumber("020 7946 0018", "GB").e164, "+442079460018");
  assert.equal(validatePhoneNumber("+81 (0)90-1234-5678", "US").e164, "+819012345678");
  assert.ok(PHONE_COUNTRY_OPTIONS.some((option) => option.code === "IT"));
});

test("phone regions are not limited to supported shipping destinations", () => {
  assert.equal(dialCode("is"), "+354");
  assert.ok(PHONE_COUNTRY_OPTIONS.length > 200);
  assert.equal(validatePhoneNumber("611 1234", "IS").e164, "+3546111234");
});

test("non-Latin keyboards and international access prefixes retain the number", () => {
  assert.equal(validatePhoneNumber("＋８１　９０－１２３４－５６７８", "JP").e164, "+819012345678");
  assert.equal(validatePhoneNumber("٠٥٠ ١٢٣ ٤٥٦٧", "AE").e164, "+971501234567");
  assert.equal(validatePhoneNumber("۰۵۰ ۱۲۳ ۴۵۶۷", "AE").e164, "+971501234567");
  assert.equal(validatePhoneNumber("00 81 90 1234 5678", "GB").e164, "+819012345678");
  assert.equal(validatePhoneNumber("011 81 90 1234 5678", "US").e164, "+819012345678");
});

test("empty, malformed, multiple or short numbers never become fake deliverable contacts", () => {
  for (const invalid of [
    "",
    "abc",
    "+1",
    "+1 +82 10 2000 0000",
    "+99912345678",
    "123",
    "0000000000",
    "Call +12015550123",
    "+12015550123 / +85251234567",
    "1".repeat(101),
  ]) {
    const result = validatePhoneNumber(invalid, "US");
    assert.equal(result.valid, false, invalid);
    assert.equal(result.e164, "", invalid);
    assert.equal(fullPhoneNumber(invalid, "US"), "", invalid);
  }
  assert.equal(validatePhoneNumber("", "US").error, "required");
  assert.equal(validatePhoneNumber("2015550123", "").error, "country_required");
  assert.equal(validatePhoneNumber("2015550123", "XX").error, "country_required");
});

test("extensions are reported instead of silently discarded from the saved contact", () => {
  const result = validatePhoneNumber("+44 20 7946 0018 ext.123", "GB");
  assert.equal(result.valid, false);
  assert.equal(result.error, "extension_not_supported");
  assert.equal(result.e164, "");
});

test("legacy HK formatting stays compatible without manufacturing a prefix-only value", () => {
  assert.equal(dialCode("HK"), "+852");
  assert.equal(fullPhoneNumber("91234567", "HK"), "+852 91234567");
  assert.equal(localPhoneNumber("+852 91234567", "HK"), "91234567");
  assert.equal(fullPhoneNumber("", "HK"), "");
});
