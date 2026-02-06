## makeVuexNewest

```

`select * from peer where hid in (${hidList.map(hid => "'" + hid + "'").join(',')}) and hostId = :hostId`,

3

```

## getAllSearchPeer

```

查询好友或群组 包括 自己，用于搜索消息

`SELECT * FROM peer where hostId = :hostId AND isDeleted is null AND isBeBlock is null AND myBlock is null AND type = :type limit :limit offset :offset`,
{
limit,
offset,
hostId: hostId,
type
},
spaceId

```

## findPeerIn

```

查询特定人员

`SELECT * FROM peer where hostId = :hostId AND isDeleted is null AND hid != :hostId AND isBeBlock is null AND myBlock is null AND hid in (${hidList.map(hid => "'" + hid + "'").join(',')}) `,
{hostId: hostId},
spaceId

```

## findAvailableForwarders

```

选择待添加待好友

`SELECT p.* ,s.isDeleted ,s.lastReactTime as lastTime ,s.isTop FROM peer p LEFT JOIN session s ON s.hid = p.hid WHERE p.hostId = :hostId AND (p.type = 'friend' or p.type = 'group') AND p.hid != :hid AND p.hid not in (${exclude.map(hid => "'" + hid + "'").join(',')}) AND s.isDeleted is null AND p.isBeBlock is null AND p.myBlock is null ORDER by s.lastReactTime desc, s.isTop desc, p.name asc limit :start,:size`,

```

## findAvailablePersonsByLike

```

搜索好友

`select * from peer where hostId = :hostId AND (type = 'friend'or type = 'group') and isDeleted is null and hid != :hid and hid not in (${exclude.map(hid => "'" + hid + "'").join(',')}) and isDeleted is null and isBeBlock is null and myBlock is null and name like :searchVal order by isDialog desc,isTop desc,lastReactTime desc,mtime desc`,
{hid: hostId, hostId: hostId, searchVal: `%${searchVal}%`},
spaceId

```

## findAvailablePersonsByHids

```

搜索 hidList 好友

`select * from peer where hostId = :hostId and isDeleted is null and hid != :hid and hid in (${hidList.map(hid => "'" + hid + "'").join(',')}) and isDeleted is null and isBeBlock is null and myBlock is null order by isDialog desc,isTop desc,lastReactTime desc,mtime desc`,
{hid: hostId, hostId: hostId},
spaceId

```

## findPersonsByHids

```

根据 hid 查询好友信息

`select * from peer where hostId = :hostId and isDeleted is null and hid != :hid and hid in (${hidList.map(hid => "'" + hid + "'").join(',')}) order by isDialog desc,isTop desc,lastReactTime desc,mtime desc`,
{hid: hostId, hostId: hostId},
spaceId

```

## findPersonsByHids

```

```

## findAvailablePersons

```

选择待添加待好友

`select p.*,s.isDeleted,s.lastReactTime as lastTime from peer p LEFT JOIN session s ON s.hid = p.hid WHERE p.hostId = :hostId AND p.type = 'friend' AND p.type != 'group' AND p.hid != :hid AND p.hid not in (${exclude.map(hid => "'" + hid + "'").join(',')}) AND s.isDeleted is null AND p.isBeBlock is null AND p.myBlock is null ORDER BY s.lastReactTime desc,p.name asc LIMIT :start,:size`,
{start: start \* size, size, hid: hostId, hostId: hostId},
spaceId

```

## updateOrAdd

```

let {n} = await getWith('select count(hid) as n from peer where hid = :hid and hostId = :hostId', {hid, hostId}, spaceId);

```

## updateFriendTypeToPeer

```

let changes = await allWith("select hid from peer where type = 'friend'", {}, spaceId);

```

## updateNotYourFriendList

```

let currentFriendList = await allWith("select hid from peer where type = 'friend'", {}, spaceId);

```

## allChannels

```

let changes = await allWith(`select hid from peer where type = 'group'`, {}, spaceId);

```

## fetchSummaryByhids

```

`select * from peer where hostId = '${hostId}' AND hid in (${hidList.map(a => "'" + a + "'").join(',')})`,

```

## getPeerWhereAsyncDBWithSummary

```

'select \* from peer where hid = :hid AND hostId = :hostId',

```

## haveJustRead

```

`update peer set request = :accept where request = :acceptUnread AND hostId = '${hostId}'`,

```

## fetchNumber

```

'select count(\*) as n from peer where request=:acceptUnread AND hostId = :hostId',

```

## fetchRequests

```

`select * from peer where hostId = '${hostId}' AND request between 1 and 19 order by mtime desc limit 7000`,

```

## deleteContactDB

```

`update peer set type = 'peer' where type = 'friend' AND hid = :hid`,
{
hid
},
spaceId

```

## fetchWholeForChannel

```

let summary = await getWith('select \* from peer where hid = :hid AND hostId = :hostId', {hid, hostId: hostId}, spaceId);

```

## areWeFriend

```

"select count(\*) as n from peer where hid=:hid and hostId = :hostId AND type = 'friend' AND isDeleted is NULL",
{hid, hostId: hostId},
spaceId

```

## makeMessageFail

```

`update message set messageStatus=1 where hostId=:hostId and uuid=:uuid`

```

## makeMessageSuccess

```

`update message set messageStatus=3 where hostId=:hostId and uuid=:uuid`

```

## deleteAMessage

```

`delete from message where uuid=:uuid and hostId=:hostId`

```

## checkIfsendMsg

```

`select type,hid from peer where hid=:hid`

```

## readSettings

```

`SELECT * from setting WHERE spaceId = :spaceId AND hid = :hid`,

```

## fetchMessageByUUID

```

`select * from message where uuid=:uuid AND :hostId = :hostId`, {uuid, hostId}, spaceId)

<!-- refshAvatar -->

```

## getPeersByHids

```

`select * from peer where hostId = '${hostId}' AND hid in (${hids.map(a => "'" + a + "'").join(',')})`,

```

## getSinglePeerByHid

```

`select _ from peer where hostId = :hostId And hid = :hid`, {hid, hostId}, spaceId);

```

## showMe

```

`select _ from peer where hid=:hid and hostId=:hostId`,

```

## assertWhatBeNotDeleted

```

`select _ from peer where hostId=:hostId and hid=:hid`,

```

## fetchMessageFrom

```

` select * from message where dialogId = :dialogId AND hostId = :hostId and c not in (:a,:b) and (MIMETYPE is null or MIMETYPE not in (:a,:b)) and isDeleted is null ${stime == 0 ? '' :`and stime ${dir == 'after' ? '<' : '>'} :stime`} order by stime ${dir == 'before' ? 'asc' : 'desc'} limit 30 `,{dialogId,hostId,a: 'application/receipt',b: 'application/cmd',stime: stime == 0 ? undefined : stime},spaceId

```

## fetchMessageAfterAToB

```

`select * from message where dialogId = :dialogId AND hostId = :hostId and c not in (:a,:b) and (MIMETYPE is null or MIMETYPE not in (:a,:b)) and isDeleted is null and stime < :astime and stime >= :bstime order by stime desc`,{dialogId,hostId,a: 'application/receipt',b: 'application/cmd',astime,bstime},spaceId

```

## takeUUIDOrder

```

`select * from message where dialogId = :dialogId and hostId = :hostId and c not in(:a,:b) and (MIMETYPE is null or MIMETYPE not in (:a,:b)) and isDeleted is null order by stime desc limit :start,:end`,{hostId: await getHid(),dialogId,a: 'application/receipt',b: 'application/cmd',start: n - 1,end: n},spaceId

```

## takeLastMessage

```

`select * from message where dialogId = :dialogId and c in ("HyperText","Event") and (MIMETYPE is null or MIMETYPE not in (:a,:b)) and isDeleted is null order by stime desc limit 1`,{dialogId,a: 'application/receipt',b: 'application/cmd'},spaceId

```

## fetchMetioned

```

'select remindlist from session where hid=:hid', {hid: peerid}, spaceId

```

## saveMentioned

```

'select remindlist from session where hostId=:hostId and hid=:hid',{hid: peerid,hostId},spaceId

```

## fetchFiles

```

`select message.*,peer.firstName as senderfirstName,peer.lastName as senderlastName from message left join peer where message.peerId == peer.hid and peer.hostId = :me and message.filelisttype = :type and message.dialogId = :dialogId order by message.stime desc limit :start, :howmuch`,{start: startPage \* howmuch,howmuch,me,dialogId,type: MetaTypes[type]},spaceId
```
