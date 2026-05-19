import AdminEditForm from "./_components/AdminEditForm";
import ProtectedPageTemplate from "@/components/ProtectedPageTemplate/ProtectedPageTemplate";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import { routes } from "@/constants/routes";

type Props = {
  params: {
    adminId: string;
  };
};


const AdminEditPage = async ({ params }: Props) => {
  const { adminId } = await params;
  console.log(adminId);
  
  const breadcrumbItems = [
    { label: "ホーム", path: routes.TOP },
    { label: "管理者一覧", path: routes.ADMINS },
    { label: "管理者詳細", path: routes.ADMIN_DETAIL(adminId) },
    { label: "管理者編集", path: ''}
  ];

  return (
    <ProtectedPageTemplate>
      <Breadcrumb items={breadcrumbItems} />
      <AdminEditForm adminId={adminId}/>
    </ProtectedPageTemplate>
  );
};

export default AdminEditPage;
