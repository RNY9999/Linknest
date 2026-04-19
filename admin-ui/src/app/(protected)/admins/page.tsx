import ProtectedPageTemplate from "@/components/ProtectedPageTemplate/ProtectedPageTemplate";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import styles from "./admins.module.css";
import { routes } from "@/constants/routes";

const adminsPage = () => {
  const breadcrumbItems = [
    {label: 'ホーム', path: routes.TOP},
    {label: '管理者一覧', path: routes.ADMINS}
  ]
  return (
    <ProtectedPageTemplate>
      <Breadcrumb items={breadcrumbItems}/>
      <h1>管理者一覧</h1>
    </ProtectedPageTemplate>
  )
}

export default adminsPage;