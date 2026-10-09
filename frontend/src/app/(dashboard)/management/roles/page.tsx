'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Plus,
  Save,
  Trash2,
  CheckCheck,
  XCircle,
  FolderTree,
  ChevronRight,
  ChevronDown,
  Layers,
  Key,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface MenuItem {
  id: number;
  title: string;
  route?: string;
  icon?: string;
  urutan: number;
  type: number; // 0 = Single Menu, 1 = Multi Menu / Group
  parrent?: number | null;
  readx: boolean;
  addx: boolean;
  updatex: boolean;
  deletex: boolean;
  subItem?: MenuItem[];
  menu_klp_list_id?: number | null;
}

export default function ManagementRolesPage() {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedRoleName, setSelectedRoleName] = useState<string>('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [treeData, setTreeData] = useState<MenuItem[]>([]);

  // 1. Ambil daftar kelompok role dari backend
  const { data: roles, isLoading: isRolesLoading } = useQuery({
    queryKey: ['management-roles'],
    queryFn: async () => {
      const res = await api.get('/management/roles');
      return res.data;
    },
  });

  // Pilih role pertama saat data role berhasil dimuat
  useEffect(() => {
    if (roles && roles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(String(roles[0].id));
      setSelectedRoleName(roles[0].nama);
    }
  }, [roles, selectedRoleId]);

  // 2. Ambil pohon menu & izin untuk role terpilih
  const { data: rolePermissions, isLoading: isPermsLoading } = useQuery({
    queryKey: ['role-permissions', selectedRoleId],
    queryFn: async () => {
      if (!selectedRoleId) return [];
      const res = await api.get(`/management/roles/${selectedRoleId}`);
      return res.data;
    },
    enabled: !!selectedRoleId,
  });

  // Sinkronkan state lokal pohon izin saat rolePermissions berubah
  useEffect(() => {
    if (rolePermissions && Array.isArray(rolePermissions)) {
      setTreeData(JSON.parse(JSON.stringify(rolePermissions)));
    }
  }, [rolePermissions]);

  const handleSelectRole = (r: any) => {
    setSelectedRoleId(String(r.id));
    setSelectedRoleName(r.nama);
  };

  // Helper pembaruan recursive item izin
  const updateItemPermission = (
    items: MenuItem[],
    targetId: number,
    field: 'readx' | 'addx' | 'updatex' | 'deletex',
    value: boolean
  ): MenuItem[] => {
    return items.map((item) => {
      if (item.id === targetId) {
        return { ...item, [field]: value };
      }
      if (item.subItem && item.subItem.length > 0) {
        return {
          ...item,
          subItem: updateItemPermission(item.subItem, targetId, field, value),
        };
      }
      return item;
    });
  };

  // Toggle satu checkbox izin
  const handleToggle = (
    itemId: number,
    field: 'readx' | 'addx' | 'updatex' | 'deletex',
    currentVal: boolean
  ) => {
    setTreeData((prev) => updateItemPermission(prev, itemId, field, !currentVal));
  };

  // Set Semua / Hapus Semua Izin untuk satu baris menu
  const handleRowCheckAll = (itemId: number, enableAll: boolean) => {
    const updateRow = (items: MenuItem[]): MenuItem[] => {
      return items.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            readx: enableAll,
            addx: enableAll,
            updatex: enableAll,
            deletex: enableAll,
          };
        }
        if (item.subItem && item.subItem.length > 0) {
          return { ...item, subItem: updateRow(item.subItem) };
        }
        return item;
      });
    };
    setTreeData((prev) => updateRow(prev));
  };

  // Set Akses Penuh (Global) untuk semua menu
  const handleSetAllPermissions = (enable: boolean) => {
    const recursiveSet = (items: MenuItem[]): MenuItem[] => {
      return items.map((item) => ({
        ...item,
        readx: enable,
        addx: enable,
        updatex: enable,
        deletex: enable,
        subItem: item.subItem ? recursiveSet(item.subItem) : [],
      }));
    };
    setTreeData((prev) => recursiveSet(prev));
    toast.info(enable ? 'Semua hak akses dicentang' : 'Semua hak akses dinonaktifkan');
  };

  // Mutation Simpan Matriks Hak Akses
  const savePermissionsMutation = useMutation({
    mutationFn: () => {
      return api.post('/management/permissions', {
        roleId: selectedRoleId,
        roleName: selectedRoleName,
        list_menu: treeData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions', selectedRoleId] });
      toast.success(`Matriks izin role "${selectedRoleName}" berhasil disimpan ke basis data!`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menyimpan izin ke database');
    },
  });

  // Mutation Buat Role Baru
  const createRoleMutation = useMutation({
    mutationFn: () => {
      return api.post('/management/roles', {
        nama: newRoleName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management-roles'] });
      toast.success('Kelompok role baru berhasil dibuat');
      setIsAddOpen(false);
      setNewRoleName('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal membuat role');
    },
  });

  // Mutation Hapus Role
  const deleteRoleMutation = useMutation({
    mutationFn: () => {
      return api.delete(`/management/roles/${selectedRoleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management-roles'] });
      toast.success('Role berhasil dihapus');
      setIsDeleteOpen(false);
      setSelectedRoleId('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus role');
    },
  });

  return (
    <div className="px-4 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-teal-600 dark:text-teal-400 border-teal-500/30 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Otorisasi & Keamanan
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-foreground">
            Manajemen Role & RBAC (Hak Akses)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Konfigurasi dinamis hak baca (Read), tambah (Add), ubah (Edit), dan hapus (Delete) berbasis pohon menu
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setIsAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs">
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Role Baru
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Kolom Kiri: Daftar Kelompok Role */}
        <Card className="border-border/60 shadow-xs h-fit">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Daftar Kelompok Role
              </CardTitle>
              <Badge variant="secondary" className="text-[10px]">
                {roles?.length || 0} Role
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Pilih kelompok untuk mengelola matriks kewenangan
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 space-y-1.5">
            {isRolesLoading ? (
              <div className="p-4 text-center text-xs text-muted-foreground">Memuat data role...</div>
            ) : (
              roles?.map((r: any) => {
                const isSelected = selectedRoleId === String(r.id);
                return (
                  <button
                    key={r.id}
                    onClick={() => handleSelectRole(r)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs'
                        : 'border-border/40 hover:bg-muted/40 text-foreground'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <Key className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                        <span className="truncate">{r.nama}</span>
                      </div>
                      <span className="text-[10px] font-normal text-muted-foreground block truncate mt-0.5">
                        ID: #{r.id} • {r.keterangan || 'Kelompok Otorisasi'}
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'translate-x-1 text-emerald-600' : 'opacity-40'}`} />
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Kolom Kanan: Matriks Hak Akses Pohon Menu (RBAC Tree) */}
        <Card className="lg:col-span-3 border-border/60 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-foreground">
                  Matriks Hak Akses: <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{selectedRoleName || 'Pilih Role'}</span>
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">
                  ID: #{selectedRoleId}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-0.5">
                Konfigurasi 4 parameter hak akses (Read, Add, Edit, Delete) sesuai skema resmi APLI DAKOP
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSetAllPermissions(true)}
                className="h-8 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                Akses Penuh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSetAllPermissions(false)}
                className="h-8 text-xs text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Cabut Semua
              </Button>
              {Number(selectedRoleId) > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteOpen(true)}
                  className="h-8 text-xs text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Hapus Role
                </Button>
              )}
              <Button
                size="sm"
                disabled={savePermissionsMutation.isPending || isPermsLoading}
                onClick={() => savePermissionsMutation.mutate()}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {savePermissionsMutation.isPending ? 'Menyimpan...' : 'Simpan Matriks'}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 uppercase text-[11px] font-semibold text-muted-foreground border-b border-border/40">
                  <tr>
                    <th className="px-4 py-3 w-[40%]">Struktur Menu & Rute</th>
                    <th className="px-3 py-3 text-center text-emerald-700 dark:text-emerald-400 w-[12%]">
                      Buka (Read)
                    </th>
                    <th className="px-3 py-3 text-center text-blue-700 dark:text-blue-400 w-[12%]">
                      Tambah (Add)
                    </th>
                    <th className="px-3 py-3 text-center text-amber-700 dark:text-amber-400 w-[12%]">
                      Ubah (Edit)
                    </th>
                    <th className="px-3 py-3 text-center text-rose-700 dark:text-rose-400 w-[12%]">
                      Hapus (Delete)
                    </th>
                    <th className="px-3 py-3 text-center w-[12%]">Aksi Baris</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {isPermsLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-muted-foreground">
                        Memuat struktur pohon menu...
                      </td>
                    </tr>
                  ) : treeData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-muted-foreground">
                        Tidak ada menu yang terdaftar untuk role ini.
                      </td>
                    </tr>
                  ) : (
                    treeData.map((mainMenu) => (
                      <MenuGroupRow
                        key={mainMenu.id}
                        menu={mainMenu}
                        level={0}
                        onToggle={handleToggle}
                        onRowCheckAll={handleRowCheckAll}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog Tambah Role Baru */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
              <DialogTitle>Buat Kelompok Role Pengguna Baru</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Tambahkan kelompok role baru (misal: OPERATOR_DINAS, KECAMATAN, PIMPINAN) yang akan dikaitkan dengan hak akses menu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nama Kelompok Role *</Label>
              <Input
                placeholder="Contoh: OPERATOR_KECAMATAN"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value.toUpperCase())}
                className="h-9 text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Gunakan format huruf kapital yang jelas. Seluruh hak akses default akan aktif dan dapat diatur setelahnya.
              </p>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsAddOpen(false)} className="text-xs">
              Batal
            </Button>
            <Button
              disabled={!newRoleName.trim() || createRoleMutation.isPending}
              onClick={() => createRoleMutation.mutate()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
            >
              {createRoleMutation.isPending ? 'Menyimpan...' : 'Simpan Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus Role */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="w-5 h-5" />
              <DialogTitle>Hapus Kelompok Role?</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Tindakan ini akan menghapus kelompok role <strong>"{selectedRoleName}"</strong> beserta seluruh matriks izinnya.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="text-xs">
              Batal
            </Button>
            <Button
              disabled={deleteRoleMutation.isPending}
              onClick={() => deleteRoleMutation.mutate()}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs"
            >
              {deleteRoleMutation.isPending ? 'Menghapus...' : 'Ya, Hapus Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Komponen Sub-Row Rekursif untuk Menampilkan Pohon Menu
function MenuGroupRow({
  menu,
  level = 0,
  onToggle,
  onRowCheckAll,
}: {
  menu: MenuItem;
  level: number;
  onToggle: (id: number, field: 'readx' | 'addx' | 'updatex' | 'deletex', val: boolean) => void;
  onRowCheckAll: (id: number, enable: boolean) => void;
}) {
  const isGroup = menu.type === 1;
  const hasSub = menu.subItem && menu.subItem.length > 0;
  const isAllChecked = menu.readx && menu.addx && menu.updatex && menu.deletex;

  return (
    <>
      <tr className={`hover:bg-muted/40 transition-colors ${level === 0 ? 'bg-muted/15 font-semibold' : ''}`}>
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 22}px` }}>
            {level === 0 ? (
              <FolderTree className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-border shrink-0" />
            )}
            <div className="truncate">
              <span className="text-xs text-foreground">
                {menu.urutan}. {menu.title}
              </span>
              {menu.route ? (
                <span className="text-[10px] font-mono text-muted-foreground block truncate">
                  {menu.route}
                </span>
              ) : isGroup ? (
                <span className="text-[10px] text-muted-foreground font-normal block italic">
                  (Grup Multi Menu)
                </span>
              ) : null}
            </div>
          </div>
        </td>

        {/* Checkbox Read */}
        <td className="px-3 py-2.5 text-center">
          <div className="flex justify-center">
            <Checkbox
              checked={!!menu.readx}
              onCheckedChange={() => onToggle(menu.id, 'readx', !!menu.readx)}
              className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
            />
          </div>
        </td>

        {/* Checkbox Add */}
        <td className="px-3 py-2.5 text-center">
          <div className="flex justify-center">
            <Checkbox
              checked={!!menu.addx}
              onCheckedChange={() => onToggle(menu.id, 'addx', !!menu.addx)}
              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
          </div>
        </td>

        {/* Checkbox Update / Edit */}
        <td className="px-3 py-2.5 text-center">
          <div className="flex justify-center">
            <Checkbox
              checked={!!menu.updatex}
              onCheckedChange={() => onToggle(menu.id, 'updatex', !!menu.updatex)}
              className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
            />
          </div>
        </td>

        {/* Checkbox Delete */}
        <td className="px-3 py-2.5 text-center">
          <div className="flex justify-center">
            <Checkbox
              checked={!!menu.deletex}
              onCheckedChange={() => onToggle(menu.id, 'deletex', !!menu.deletex)}
              className="data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
            />
          </div>
        </td>

        {/* Quick Row Check / Uncheck */}
        <td className="px-3 py-2.5 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRowCheckAll(menu.id, !isAllChecked)}
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
          >
            {isAllChecked ? 'Kosongkan' : 'Semua'}
          </Button>
        </td>
      </tr>

      {/* Render Anak Menu (Submenu) secara rekursif */}
      {hasSub &&
        menu.subItem!.map((sub) => (
          <MenuGroupRow
            key={sub.id}
            menu={sub}
            level={level + 1}
            onToggle={onToggle}
            onRowCheckAll={onRowCheckAll}
          />
        ))}
    </>
  );
}
