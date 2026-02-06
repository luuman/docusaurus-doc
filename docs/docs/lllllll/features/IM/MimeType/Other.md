

<!-- tabs:start -->

#### **PushReg**

```json
// 注册连接
{
  "c": "PushReg",
  "f": <String value of from-user>,
  "meFrom": <String value of multi-endpoint-from-user>,
  "m": {
    "rid": <rid>,
    "ck": <验证串>,
    "key": <密钥串>,
    "pub": <HEX(sha1 of pubkey)>,
    "ts": <PushReg的时间>
    "ver": <vercode>,
    "loc": <Lang&Locate>,
    "net": <network-type>,
    "hash": "<push key hash>"
    "info": {
      "model": <hardware model>,
      "os": <android/ios/mac/windows>,
      "osver": <operating system version>,
      "clientver": "<client app version>",
      "pkg": <package-name>
      "bssid": "xxxx",
      "apn": "xxxx",
      "reason": "<previous disconnect reason>",
      "extPushType": <3rd-party-push type. gcm/mipush/apns/...>
      ...
    },
    "padding": <1-64字节padding>
  }
}
```

#### **PullDetail**

```json
// 拉取历史消息
{
  "c": "PullDetail",
  "f": <String value of from-user>,
  "meFrom": <String value of multi-endpoint-from-user>,
  "mcFrom": <String value of multi-corporation-from-user>,
  "expire": 1608903290194,
  "l": 5184000,
  "m": {
    "count": 20,
    "direction": 0,
    "eTS": 0,
    "ignoreReciept": 0,
    "reqId": "",
    "sTS": 1603719281752,
    "tid": ""
  }
}
```

#### **ForceClose**

```json
// 强制关闭连接
{
  "c": "ForceClose",
  "t": <String value of to-user>,
  "meTo": <String value of multi-endpoint-to-user>,
  "m": {
    "type": <String value of type>,
    "rid": <String value of changed_to_rid>,
    "by": <String value of by Register/ResetPassword/Login/Logout/Eject>,
    "model": <String value of model>,
    "ip": <String value of ip>,
    "time": <Long value of change save time>,
    "until": <Eject until time. java timestamp. only in Eject>
  }
}
```

| ForceClose type     | 说明                                          |
| ------------------- | --------------------------------------------- |
| RID_CHANGE          | 退出登录，客户端收到此类型信令需要重新登录    |
| KICK_USER           | 强踢用户，客户端收到此类型信令需要 RECONNECT  |
| FORCE_LOGOUT        | 退出登录，踢出用户到登录界面                  |
| FORCE_LOGOUT_DELETE | 退出登录，踢出用户到登录界面,同时删除用户数据 |

#### **StateReport**

```json
{
"c":"StateReport",
"f":<from>,
"m":{
    "foreground":<0/1>,  //是否处于前台
    "isUnderVPN":<0/1>,  //是否在VPN下
    "info":{
      "netdev":["en0","ipsec0","ppp0","tun0"],
    } //map that contains other info
  }
}
```

```json
{
  "m": {
    "background": 0,
    "info": {
      "netdev": ["en0"]
    },
    "isUnderVPN": 0
  },
  "noDisturb": false,
  "c": "StateReport",
  "isSyncFrom": false,
  "f": "+97173409586436413"
}
```

<!-- tabs:end -->
