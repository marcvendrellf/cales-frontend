import { Route, Routes } from "react-router-dom"
import { AppShell } from "@/components/layout/AppShell"
import { CommandCenter } from "@/pages/CommandCenter"
import { CommodityDetail } from "@/pages/CommodityDetail"
import { Overview } from "@/pages/Overview"
import { Login } from "@/pages/Login"
import { Register } from "@/pages/Register"
import { ReportViewer } from "@/pages/ReportViewer"
import { Signals } from "@/pages/Signals"
import { Toaster } from "@/components/ui/sonner"

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/c/:id/reports/:reportId" element={<ReportViewer />} />
        <Route path="/c/:id/report/view/:reportId" element={<ReportViewer />} />
        <Route path="/r/:reportId" element={<ReportViewer publicMode />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<Overview />} />
          <Route path="/reports" element={<CommandCenter />} />
          <Route path="/c/:id" element={<CommodityDetail />} />
          <Route path="/c/:id/general-information" element={<CommodityDetail />} />
          <Route path="/c/:id/create-report" element={<CommodityDetail />} />
          <Route path="/c/:id/reports" element={<CommodityDetail />} />
          <Route path="/c/:id/report" element={<CommodityDetail />} />
          <Route path="/c/:id/preview" element={<CommodityDetail />} />
          <Route path="/signals" element={<Signals />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  )
}
