"use client"

import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ShieldCheck, UserCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"

export interface TargetPegawai {
  id: string
  nip: string
  nama: string
  username: string
  email?: string
  hp?: string
  unitKerjaNama?: string
  instansiNama?: string
  currentRole?: {
    id: string
    nama: string
  }
  hasRole?: boolean
}

interface SetRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: TargetPegawai | null
  roles: any[]
}

export function SetRoleDialog({ open, onOpenChange, target, roles = [] }: SetRoleDialogProps) {
  const queryClient = useQueryClient()
  const [selectedRoleId, setSelectedRoleId] = useState<string>("0")

  useEffect(() => {
    if (target?.currentRole?.id && target.currentRole.id !== "0") {
      setSelectedRoleId(String(target.currentRole.id))
    } else {
      setSelectedRoleId("0")
    }
  }, [target, open])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!target) return
      const res = await api.put("/management/users", {
        id: target.id,
        roleId: selectedRoleId,
      })
      return res.data
    },
    onSuccess: (data) => {
      toast.success(
        data?.message || `Hak akses role untuk ${target?.nama} berhasil diperbarui`
      )
      queryClient.invalidateQueries({ queryKey: ["management-users"] })
      onOpenChange(false)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Gagal menetapkan role"
      toast.error(msg)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-600 text-lg">
            <UserCheck className="h-5 w-5" />
            Penetapan / Ubah Hak Akses Role
          </DialogTitle>
          <DialogDescription className="text-xs">
            Tetapkan peran RBAC APLI DAKOP untuk akun pegawai terpilih dari server E-Gov.
          </DialogDescription>
        </DialogHeader>

        {target && (
          <div className="space-y-4 py-2 text-xs">
            {/* Box Identitas Pegawai */}
            <div className="rounded-lg border bg-muted/40 p-3.5 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="font-semibold text-foreground text-sm block">
                    {target.nama}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span className="text-muted-foreground font-mono">
                      NIP: {target.nip || "-"}
                    </span>
                    {target.username && (
                      <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
                        @{target.username}
                      </Badge>
                    )}
                  </div>
                </div>

                {target.hasRole && target.currentRole?.nama ? (
                  <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    {target.currentRole.nama}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    Belum Ada Role
                  </Badge>
                )}
              </div>

              <div className="pt-1 border-t border-border/40 text-[11px] text-muted-foreground space-y-1">
                <div>
                  <span className="font-medium text-foreground">Sub-Unit: </span>
                  {target.unitKerjaNama || "-"}
                </div>
                <div>
                  <span className="font-medium text-foreground">Instansi: </span>
                  {target.instansiNama || "-"}
                </div>
              </div>
            </div>

            {/* Pilihan Kelompok Role */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Pilih Kelompok Role RBAC *</Label>
              <Select
                value={selectedRoleId}
                onValueChange={(val) => setSelectedRoleId(val)}
              >
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder="Pilih Kelompok Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0" className="text-xs text-muted-foreground">
                    -- Nonaktifkan Akses (Tanpa Role) --
                  </SelectItem>
                  {roles?.map((r: any) => (
                    <SelectItem key={r.id} value={String(r.id)} className="text-xs">
                      {r.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Setiap role menentukan hak akses baca, tambah, ubah, dan hapus pada modul APLI DAKOP.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
            className="text-xs"
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !target}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
          >
            {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Simpan Hak Akses
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
