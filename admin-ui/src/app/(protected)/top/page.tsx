import SideMenu from "@/components/SideMenu/SideMenu";
import ProtectedPageTemplate from "@/components/ProtectedPageTemplate/ProtectedPageTemplate";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import styles from "./top.module.css";
import { routes } from "@/constants/routes";

const topPage = () => {
  const breadcrumbItems = [
    {label: 'ホーム', path: routes.TOP},
  ]
  return (
    <ProtectedPageTemplate>
      <Breadcrumb items={breadcrumbItems}/>
      <h1>TOP</h1>
    </ProtectedPageTemplate>
  )
}

export default topPage;