import { Breadcrumb } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

interface IBreadcrumbItem {
  icon?: React.ReactNode;
  label: string;
  href?: string;
}

interface IProps {
  items: IBreadcrumbItem[];
}

const AppBreadcrumb = ({ items }: IProps) => {
  return (
    <Breadcrumb
      style={{ marginBottom: 16, padding: "10px 0" }}
      items={[
        {
          title: (
            <Link to="/admin">
              <HomeOutlined />
            </Link>
          ),
        },
        ...items.map((item) => ({
          title: item.href ? (
            <Link to={item.href}>
              {item.icon} {item.label}
            </Link>
          ) : (
            <span>
              {item.icon} {item.label}
            </span>
          ),
        })),
      ]}
    />
  );
};

export default AppBreadcrumb;
