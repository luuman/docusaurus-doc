
use lazy_static::lazy_static;
use std::sync::{Arc, Mutex};
use once_cell::sync::Lazy;
use std::rc::Rc;
use std::cell::RefCell;

#[derive(Clone)]
struct Singleton {
    data: String,
}

impl Singleton {
    // 获取单例实例的方法
    fn get_instance() -> Arc<Mutex<Singleton>> {
        // 使用懒加载创建单例实例
        // 这里使用了 Arc 和 Mutex 来实现线程安全的单例
        // 只有第一次调用 get_instance 时会创建实例，之后都会返回已创建的实例
        static mut INSTANCE: Option<Arc<Mutex<Singleton>>> = None;
        unsafe {
            INSTANCE.get_or_insert_with(|| {
                Arc::new(Mutex::new(Singleton {
                    data: String::from("Singleton instance"),
                }))
            }).clone()
        }
    }
}

lazy_static! {
    static ref INSTANCE1: Mutex<Singleton> = Mutex::new(Singleton {
        data: String::from("Singleton instance"),
    });
}

static INSTANCE2: Lazy<Singleton> = Lazy::new(|| Singleton {
    data: String::from("Singleton instance"),
});

fn main() {
    // lazy_static
    let instance1 = INSTANCE1.lock().unwrap();
    println!("{}", instance1.data);

    // once_cell
    let instance2 = INSTANCE2.clone();
    println!("{}", instance2.data);

    // arc + mutex
    let instance3 = Singleton::get_instance();
    let instance4 = Singleton::get_instance();
     // 修改单例数据
    {
        let mut instance = instance3.lock().unwrap();
        instance.data = String::from("Modified singleton instance");
    }
     // 输出单例数据
    {
        let instance = instance4.lock().unwrap();
        println!("{}", instance.data);
    }

    // rc + refcell
    let instance5 = Rc::new(RefCell::new(Singleton {
        data: String::from("Singleton instance"),
    }));
    // 获取单例实例
    {
        let borrowed_instance = instance5.borrow();
        println!("{}", borrowed_instance.data);
    }
    {
        let mut borrowed_instance = instance5.borrow_mut();
        borrowed_instance.data = String::from("Modified5 singleton instance");
    }
    {
        let borrowed_instance = instance5.borrow();
        println!("{}", borrowed_instance.data);
    }
}
