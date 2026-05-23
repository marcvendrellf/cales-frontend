import { Route, Routes } from "react-router-dom"
import { AppShell } from "@/components/layout/AppShell"
import { CommandCenter } from "@/pages/CommandCenter"
import { CommodityDetail } from "@/pages/CommodityDetail"
import { Overview } from "@/pages/Overview"
import { Login } from "@/pages/Login"
import { Register } from "@/pages/Register"
import { Signals } from "@/pages/Signals"
import { Toaster } from "@/components/ui/sonner"

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<Overview />} />
          <Route path="/reports" element={<CommandCenter />} />
          <Route path="/c/:id" element={<CommodityDetail />} />
          <Route path="/c/:id/report" element={<CommodityDetail />} />
          <Route path="/c/:id/preview" element={<CommodityDetail />} />
          <Route path="/signals" element={<Signals />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  )
}
