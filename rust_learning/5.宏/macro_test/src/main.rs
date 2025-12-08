use std::time::{SystemTime, UNIX_EPOCH};

macro_rules! times_five {
    ($e:expr) => { 5 * $e };
}

macro_rules! multiply_add {
    ($a:expr, $b:expr, $c:expr) => { $a * ($b + $c) };
}

macro_rules! mbe {
    ($($e:expr)?) => {
        {
            println!("ruler match ?");
            let mut vec = Vec::new();
            $(
                vec.push(format!("{}", $e));
            )*
            vec
        }
    };
    ($($e:expr),*) => {
        {
            println!("ruler match *");
            let mut vec = Vec::new();
            $(
                vec.push(format!("{}", $e));
            )*
            vec
        }
    };
}

macro_rules! compare1_two {
    ($($i:expr)*, $($i2:expr)*) => {
        let mut sum1 = 0;
        let mut sum2 = 0;
        $( 
            sum1 += $i;
            sum2 += $i2; 
        )*
        if sum1 > sum2 {
            println!("{} is gather than by {}", stringify!($($i)*), stringify!($($i2)*));
        } else {
            println!("{} is less than or equal to {}", stringify!($($i)*), stringify!($($i2)*));
        }
    }
}

macro_rules! LOG {
    (DEBUG, $($EXP: expr), *) => {
        let mut buffer = String::new();
        $(
            buffer.push_str(&format!("{:?}", $EXP));
        )*
        let now = SystemTime::now();
        let since_epoch = now.duration_since(UNIX_EPOCH)
            .expect("Failed to get timestamp");
        let seconds = since_epoch.as_secs();
        let milliseconds = since_epoch.subsec_millis();
        let formatted_time = format!("{:02}-{:02} {:02}:{:02}:{:02}.{:03}",
            (seconds / 60 / 60 / 24 % 12) + 1, // Month
            (seconds / 60 / 60 / 24 % 31) + 1, // Day
            (seconds / 60 / 60 % 24),         // Hour
            (seconds / 60 % 60),              // Minute
            (seconds % 60),                   // Second
            milliseconds                      // Milliseconds
        );
        println!("{}: [DEBUG] {}", formatted_time, buffer);
    };
}

macro_rules! gruad_let_return {
    ($opt:expr) => {
        if let Some(x) = $opt {
            x
        } else {
            return;
        }
    };
}

fn main() {
    // 三种调用
    let num1 = times_five![5];
    let num2 = times_five!(5);
    let num3 = times_five!{5};
    println!("num1: {}, num2: {}, num3: {}", num1, num2, num3);

    let num4 = multiply_add![5, 5, 5];
    println!("num4: {}", num4);
    
    
    // 调用重复匹配的宏
    let vec1 = mbe![5];
    let vec2 = mbe![5, 5, 5];
    println!("vec1: {:?}, vec2: {:?}", vec1, vec2);

    // 多个重复匹配的宏
    compare1_two!(2 3 4, 5 6 1);

    // 自定义打印
    let parameter1 = "fbwebjdw";
    let parameter2 = (10, "12", "ddd");
    LOG!(DEBUG, "this debug log parameter1：", parameter1, ", parameter2：", parameter2);

    let t = Some(64);
    match t {
        Some(x) => println!("t is: {}", x),
        _ => println!("t is None"),
    }
    if let Some(x) = t {
        println!("t is: {}", x);
    }

    // 函数体表达式解析可选
    let num = Some(50);
    let num = {
        if let Some(x) = num {
            x
        } else {
            0
        }
    };
    println!("num: {}", num);

    // 可选值宏解析
    let a = Some(40);
    let a = gruad_let_return!(a);
    println!("{}", a);
}