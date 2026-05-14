import ProtectedPageTemplate from "@/components/ProtectedPageTemplate/ProtectedPageTemplate";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import AdminDetail from "./_components/AdminDetail";
import { routes } from "@/constants/routes";
import styles from "./adminDetail.module.css";

// RUL の adminId を受け取るための 型: Props
type Props = {
  params: {
    adminId: string;
  };
};

// パンくずリスト内容
const breadcrumbItems = [
  { label: "ホーム", path: routes.TOP },
  { label: "管理者一覧", path: routes.ADMINS },
  { label: "管理者詳細", path: "" },
];

const AdminDetailPage = async ({ params }: Props) => {
  const { adminId } = await params;
  console.log(adminId);
  return (
    <ProtectedPageTemplate>
      <Breadcrumb items={breadcrumbItems} />
      <AdminDetail adminId={adminId} />
    </ProtectedPageTemplate>
  );
};

export default AdminDetailPage;
