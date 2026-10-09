"use client"

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
import { AlertTriangle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { TargetPegawai } from "./set-role-dialog"

interface RevokeRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: TargetPegawai | null
}

export function RevokeRoleDialog({ open, onOpenChange, target }: RevokeRoleDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      if (!target) return
      const res = await api.put("/management/users", {
        id: target.id,
        roleId: 0,
      })
      return res.data
    },
    onSuccess: (data) => {
      toast.success(
        data?.message || `Hak akses untuk ${target?.nama} berhasil dicabut`
      )
      queryClient.invalidateQueries({ queryKey: ["management-users"] })
      onOpenChange(false)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Gagal mencabut hak akses"
      toast.error(msg)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive text-lg">
            <AlertTriangle className="h-5 w-5" />
            Cabut Hak Akses Role
          </DialogTitle>
          <DialogDescription className="text-xs">
            Tindakan ini akan mengosongkan peran role APLI DAKOP untuk akun pegawai ini sehingga tidak dapat lagi mengakses modul aplikasi.
          </DialogDescription>
        </DialogHeader>

        {target && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-1 text-xs text-foreground">
            <div>
              <span className="font-semibold block">{target.nama}</span>
              <span className="text-muted-foreground font-mono">NIP: {target.nip || "-"}</span>
            </div>
            {target.currentRole?.nama && (
              <div className="text-muted-foreground mt-1">
                Peran Akses Saat Ini:{" "}
                <span className="font-medium text-destructive">{target.currentRole.nama}</span>
              </div>
            )}
            <div className="text-[11px] text-muted-foreground pt-1 leading-snug">
              Status akun di APLI DAKOP akan menjadi <strong className="text-destructive">Belum Diberi Akses</strong>.
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
            variant="destructive"
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !target}
            className="text-xs"
          >
            {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Cabut Akses Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
