import { z } from 'zod';

const id = z.union([z.string(), z.number()]).transform(String).pipe(
  z.string().trim().min(1).max(64).regex(/^[\p{L}\p{N}._:@/-]+$/u),
);
const text = (max = 255) => z.string().trim().max(max);
const requiredText = (max = 255) => text(max).pipe(z.string().min(1));
const nonNegativeNumber = z.coerce.number().finite().min(0).max(1_000_000_000_000);
const optionalNumberLike = z.union([z.string().trim().max(40), nonNegativeNumber]).optional();
const year = z.coerce.number().int().min(1900).max(2200);

export const routeIdSchema = id;

export const masterJenisSchema = z.object({ uraian: requiredText(150) }).strict();

export const pelakuUmkmSchema = z.object({
  namaPemilik: requiredText(200),
  nik: z.string().trim().regex(/^\d{8,20}$/),
  kk: z.string().trim().max(20).regex(/^(?:\d{8,20}|-)$/).optional().default('-'),
  nohp: text(30).optional().default(''),
  namaUsaha: requiredText(250),
  tahunBerdiri: year,
  modalSendiri: nonNegativeNumber.optional().default(0),
  modalLuar: nonNegativeNumber.optional().default(0),
  omsetTahun: nonNegativeNumber.optional().default(0),
  tenagaKerja: z.coerce.number().int().min(0).max(1_000_000).optional().default(0),
  nib: text(100).optional().default(''),
  pirt: text(100).optional().default(''),
  halal: text(100).optional().default(''),
  haki: text(100).optional().default(''),
  keterangan: text(2_000).optional().default(''),
  kecamatanId: id.optional(),
  desaId: id.optional(),
  jenisUsahaId: id.optional(),
}).strict();

export const pelakuImportRecordSchema = pelakuUmkmSchema.pick({
  nik: true,
  kk: true,
  namaPemilik: true,
  namaUsaha: true,
  nohp: true,
  tahunBerdiri: true,
  modalSendiri: true,
  modalLuar: true,
  omsetTahun: true,
  tenagaKerja: true,
  nib: true,
  pirt: true,
  halal: true,
  haki: true,
}).extend({
  kecamatanNama: text(150).optional().default(''),
  desaNama: text(150).optional().default(''),
  jenisUsahaNama: text(150).optional().default(''),
  tahunPendataan: year,
}).strict();

export const pelakuImportSchema = z.object({
  records: z.array(pelakuImportRecordSchema).min(1).max(500),
  tahun: year,
}).strict();

export const koperasiSchema = z.object({
  namaKoperasi: requiredText(250),
  noBadanHukum: text(150).optional().default(''),
  tglBadanHukum: text(10).optional().default(''),
  nikop: text(100).optional().default(''),
  alamat: text(2_000).optional().default(''),
  kecamatanId: id.optional(),
  desaId: id.optional(),
  jenisKoperasiId: id,
  statusAktif: z.boolean(),
  jumlahAnggota: optionalNumberLike,
  modalSendiri: optionalNumberLike,
  modalLuar: optionalNumberLike,
  aset: optionalNumberLike,
  volumeUsaha: optionalNumberLike,
  shu: optionalNumberLike,
  ketua: text(200).optional().default(''),
  telpKoperasi: text(30).optional().default(''),
  keterangan: text(2_000).optional().default(''),
  bentukKoperasi: text(150).optional().default(''),
  polaPengelolaan: text(150).optional().default(''),
  sektorUsaha: text(200).optional().default(''),
  kelompokKoperasi: text(150).optional().default(''),
  kabupatenKota: text(150).optional().default(''),
  kelurahanSumber: text(150).optional().default(''),
  desaSumber: text(150).optional().default(''),
  kodePos: text(10).optional().default(''),
  email: z.union([z.literal(''), z.string().trim().email().max(254)]).optional().default(''),
  kuk: optionalNumberLike,
  grade: text(50).optional().default(''),
  statusAkunOdsMandiri: text(100).optional().default(''),
  tahunPendataan: z.union([z.literal(''), year]).optional().default(''),
  tanggalDiterima: text(10).optional().default(''),
}).strict();

export const pembiayaanUmkmSchema = z.object({
  pelakuId: id,
  tahun: year,
  jenisBantuan: z.enum(['tunai', 'sarana', 'both']).optional(),
  bantuTunai: z.union([text(255), nonNegativeNumber]).optional().default(''),
  bantuSarana: text(1_000).optional().default(''),
  keterangan: text(2_000).optional().default(''),
  selectedPelaku: z.unknown().optional(),
}).strict();

export const pembiayaanKoperasiSchema = z.object({
  koperasiId: id,
  tahun: year,
  sumberPembiayaan: requiredText(250),
  lembagaPenyalur: requiredText(250),
  jumlahPinjaman: nonNegativeNumber,
  statusPengajuan: requiredText(100),
  keterangan: text(2_000).optional().default(''),
}).strict();

export const userCreateSchema = z.object({
  username: z.string().trim().min(3).max(100).regex(/^[a-zA-Z0-9._-]+$/),
  password: z.string().min(12).max(256),
  nama: text(200).optional(),
  email: z.string().trim().email().max(254),
  hp: text(30).optional(),
  roleId: id,
  nip: text(64).optional(),
  unitKerjaId: id,
}).strict();

export const userUpdateSchema = z.object({
  id,
  roleId: id,
  username: z.string().trim().min(3).max(100).regex(/^[a-zA-Z0-9._-]+$/).optional(),
  email: z.string().trim().email().max(254).optional(),
  hp: text(30).optional(),
}).strict();

export const resetPasswordSchema = z.object({
  userId: id,
  password: z.string().min(12).max(256),
}).strict();

export const idBodySchema = z.object({ id }).strict();

type MenuItem = {
  id: number;
  title: string;
  route?: string;
  icon?: string;
  urutan: number;
  type: number;
  parrent?: number | null;
  readx: boolean;
  addx: boolean;
  updatex: boolean;
  deletex: boolean;
  subItem?: MenuItem[];
  menu_klp_list_id?: number | null;
};

const menuItemSchema: z.ZodType<MenuItem> = z.lazy(() => z.object({
  id: z.coerce.number().int().positive(),
  title: requiredText(200),
  route: text(500).optional(),
  icon: text(100).optional(),
  urutan: z.coerce.number().int().min(0).max(10_000),
  type: z.coerce.number().int().min(0).max(10),
  parrent: z.coerce.number().int().positive().nullable().optional(),
  readx: z.boolean(),
  addx: z.boolean(),
  updatex: z.boolean(),
  deletex: z.boolean(),
  subItem: z.array(menuItemSchema).max(100).optional(),
  menu_klp_list_id: z.coerce.number().int().positive().nullable().optional(),
}).strict());

export const roleCreateSchema = z.object({
  nama: requiredText(150),
  list_menu: z.array(menuItemSchema).max(100).optional(),
}).strict();

export const roleUpdateSchema = z.object({
  nama: requiredText(150),
  list_menu: z.array(menuItemSchema).max(100),
}).strict();

export const permissionSchema = z.object({
  roleId: id,
  roleName: requiredText(150),
  list_menu: z.array(menuItemSchema).max(100),
}).strict();

export const nikResolutionSchema = z.object({
  batchId: id,
  nik: z.string().trim().regex(/^\d{8,20}$/),
  sourceSheet: text(150),
  sourceRow: z.coerce.number().int().positive().max(1_000_000),
  namaPemilik: requiredText(200),
  namaUsaha: requiredText(250),
  jenisUsahaId: id,
  kecamatanId: id,
  desaId: id,
  modalUsaha: nonNegativeNumber,
}).strict();

const verificationFlagSchema = z.object({
  mode: z.enum(['flag', 'resolve']),
  koperasiId: id,
  reason: requiredText(2_000),
}).strict();

const verificationResolveSchema = z.object({
  id,
  action: z.enum(['UPDATE_EXISTING', 'CREATE_NEW', 'REJECT']),
  targetKoperasiId: id.optional(),
  form: z.record(z.string().max(64), z.json()).refine((value) => Object.keys(value).length <= 64),
  reviewNotes: text(2_000),
}).strict();

export const verificationSchema = z.union([verificationFlagSchema, verificationResolveSchema]);

export const boundedJsonObjectSchema = z.record(z.string().max(64), z.json()).superRefine((value, context) => {
  if (Object.keys(value).length > 64) context.addIssue({ code: 'custom', message: 'Terlalu banyak field.' });
});
