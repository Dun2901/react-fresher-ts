import { Breadcrumb } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

interface IProps {
  items: BreadcrumbItem[];
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
        ...items.map((item, index) => {
          const isLast = index === items.length - 1; // item cuối = trang hiện tại
          return {
            key: item.href ?? item.label,
            title:
              item.href && !isLast ? ( // chỉ có link nếu không phải item cuối
                <Link to={item.href}>
                  {item.icon && <>{item.icon} </>}
                  {item.label}
                </Link>
              ) : (
                <span>
                  {item.icon && <>{item.icon} </>}
                  {item.label}
                </span>
              ),
          };
        }),
      ]}
    />
  );
};

export default AppBreadcrumb;
