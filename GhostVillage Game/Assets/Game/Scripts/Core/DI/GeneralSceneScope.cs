using VContainer;
using VContainer.Unity;

namespace Game.Core.DI
{
    // Script này để trống trơn cũng được!
    // Mục đích duy nhất: Làm trạm trung chuyển để inject cho Scene hiện tại
    public class GeneralSceneScope : LifetimeScope
    {
        protected override void Configure(IContainerBuilder builder)
        {
            // Không cần đăng ký lại APIClient hay gì cả.
            // Nó tự động thừa kế từ thằng Mẹ (Root) ở Scene Boot.

            // Nếu scene này có logic riêng thì viết vào đây, không thì để trống.
        }
    }
}