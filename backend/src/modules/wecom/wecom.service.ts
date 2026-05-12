import { BadGatewayException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHash, randomBytes } from 'crypto'

type WecomTokenResponse = {
  errcode: number
  errmsg: string
  access_token?: string
  expires_in?: number
}

type WecomTicketResponse = {
  errcode: number
  errmsg: string
  ticket?: string
  expires_in?: number
}

type WecomUserListResponse = {
  errcode: number
  errmsg: string
  userlist?: Array<{
    userid: string
    name: string
    department?: number[]
    position?: string
    avatar?: string
  }>
}

type WecomOauthUserInfoResponse = {
  errcode: number
  errmsg: string
  UserId?: string
  OpenId?: string
  user_ticket?: string
}

type WecomUserDetailResponse = {
  errcode: number
  errmsg: string
  userid?: string
  name?: string
  department?: number[]
  mobile?: string
  avatar?: string
  position?: string
}

type CachedValue = {
  value: string
  expiresAt: number
}

export type WecomUser = {
  userId: string
  name: string
  departmentId?: number
  departmentName?: string
  mobile?: string
  position?: string
  avatar?: string
  source: 'wecom' | 'mock'
}

const mockUsers: WecomUser[] = [
  { userId: 'zhangchen', name: '张晨', departmentId: 1, departmentName: '供应链部', position: '流程发起人', source: 'mock' },
  { userId: 'linya', name: '林雅', departmentId: 2, departmentName: '财务部', position: '财务审核', source: 'mock' },
  { userId: 'wutong', name: '吴桐', departmentId: 3, departmentName: '法务行政部', position: '法务审核', source: 'mock' },
  { userId: 'zhaoqiming', name: '赵启明', departmentId: 4, departmentName: '技术部', position: '技术审核', source: 'mock' },
  { userId: 'liushaopeng', name: '刘少鹏', departmentId: 5, departmentName: '业务负责人', position: '部门负责人', source: 'mock' },
  { userId: 'pengzong', name: '彭总', departmentId: 6, departmentName: '管理层', position: '总经理', source: 'mock' },
  { userId: 'chenlu', name: '陈露', departmentId: 3, departmentName: '行政部', position: '用印归档', source: 'mock' },
  { userId: 'caigou', name: '采购', departmentId: 7, departmentName: '采购部', position: '采购执行', source: 'mock' },
  { userId: 'caiwu', name: '财务', departmentId: 2, departmentName: '财务部', position: '财务处理', source: 'mock' },
  { userId: 'yunying-shouhou', name: '运营售后', departmentId: 8, departmentName: '运营售后部', position: '售后跟踪', source: 'mock' },
]

@Injectable()
export class WecomService {
  private tokenCache = new Map<string, CachedValue>()
  private ticketCache = new Map<string, CachedValue>()

  constructor(private readonly config: ConfigService) {}

  status() {
    const corpId = this.config.get<string>('WECOM_CORP_ID')
    const agentId = this.config.get<string>('WECOM_AGENT_ID')
    const secret = this.config.get<string>('WECOM_CORP_SECRET')
    const contactSecret = this.contactSecret()
    const oauthEnabled = this.config.get<string>('WECOM_OAUTH_ENABLED') === 'true'

    return {
      configured: Boolean(corpId && agentId && secret),
      oauthEnabled,
      oauthConfigured: Boolean(oauthEnabled && corpId && agentId && secret),
      contactsConfigured: Boolean(corpId && contactSecret),
      corpIdConfigured: Boolean(corpId),
      agentIdConfigured: Boolean(agentId),
      secretConfigured: Boolean(secret),
      contactSecretConfigured: Boolean(contactSecret),
      capabilities: ['js-sdk-contact-picker', 'contacts-sync', 'fixed-template-approvers', 'app-message-send'],
    }
  }

  oauthUrl(redirectUri: string, state = 'oa', scope: 'snsapi_base' | 'snsapi_privateinfo' = 'snsapi_base') {
    const corpId = this.config.get<string>('WECOM_CORP_ID')
    const agentId = this.config.get<string>('WECOM_AGENT_ID')
    const secret = this.config.get<string>('WECOM_CORP_SECRET')
    const oauthEnabled = this.config.get<string>('WECOM_OAUTH_ENABLED') === 'true'

    if (!oauthEnabled || !corpId || !agentId || !secret || !redirectUri) {
      return {
        configured: false,
        url: '',
      }
    }

    const url = new URL('https://open.weixin.qq.com/connect/oauth2/authorize')
    url.searchParams.set('appid', corpId)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', scope)
    url.searchParams.set('agentid', agentId)
    url.searchParams.set('state', state)

    return {
      configured: true,
      url: `${url.toString()}#wechat_redirect`,
    }
  }

  async oauthLogin(code: string) {
    const secret = this.config.get<string>('WECOM_CORP_SECRET')
    const oauthEnabled = this.config.get<string>('WECOM_OAUTH_ENABLED') === 'true'
    if (!oauthEnabled || !secret || !code) {
      return {
        configured: false,
        user: mockUsers[0],
      }
    }

    const accessToken = await this.getAccessToken(secret)
    const userInfoUrl = new URL('https://qyapi.weixin.qq.com/cgi-bin/auth/getuserinfo')
    userInfoUrl.searchParams.set('access_token', accessToken)
    userInfoUrl.searchParams.set('code', code)

    const userInfo = await this.requestJson<WecomOauthUserInfoResponse>(userInfoUrl.toString())
    this.assertWecomOk(userInfo, '企业微信静默登录失败')

    if (userInfo.user_ticket) {
      return {
        configured: true,
        user: await this.fetchOauthUserDetail(accessToken, userInfo.user_ticket),
      }
    }

    if (userInfo.UserId) {
      return {
        configured: true,
        user: await this.fetchUserById(accessToken, userInfo.UserId).catch(() => ({
          userId: userInfo.UserId!,
          name: userInfo.UserId!,
          source: 'wecom' as const,
        })),
      }
    }

    throw new BadGatewayException('企业微信未返回员工身份')
  }

  async jsConfig(url: string) {
    const corpId = this.config.get<string>('WECOM_CORP_ID')
    const agentId = this.config.get<string>('WECOM_AGENT_ID')
    const secret = this.config.get<string>('WECOM_CORP_SECRET')

    if (!corpId || !agentId || !secret || !url) {
      return {
        configured: false,
        corpIdConfigured: Boolean(corpId),
        agentIdConfigured: Boolean(agentId),
        secretConfigured: Boolean(secret),
      }
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const nonceStr = randomBytes(8).toString('hex')
    const [jsapiTicket, agentTicket] = await Promise.all([
      this.getTicket(secret, 'jsapi'),
      this.getTicket(secret, 'agent_config').catch(() => ''),
    ])

    return {
      configured: true,
      corpId,
      agentId,
      timestamp,
      nonceStr,
      signature: this.signTicket(jsapiTicket, nonceStr, timestamp, url),
      agentSignature: agentTicket ? this.signTicket(agentTicket, nonceStr, timestamp, url) : '',
      jsApiList: ['selectEnterpriseContact'],
    }
  }

  async users(options: { keyword?: string; departmentId?: number; fetchChild?: boolean }) {
    const corpId = this.config.get<string>('WECOM_CORP_ID')
    const secrets = this.contactCandidateSecrets()
    const keyword = options.keyword?.trim().toLowerCase() ?? ''

    if (!corpId || !secrets.length) {
      return {
        source: 'mock' as const,
        configured: false,
        users: this.filterUsers(mockUsers, keyword),
      }
    }

    let lastError: unknown
    for (const secret of secrets) {
      try {
        return await this.fetchUsersWithSecret(secret, options, keyword)
      } catch (error) {
        lastError = error
      }
    }

    if (lastError instanceof Error) {
      throw new BadGatewayException(lastError.message)
    }
    throw new BadGatewayException('企业微信通讯录读取失败')
  }

  private contactCandidateSecrets() {
    const appSecret = this.config.get<string>('WECOM_CORP_SECRET')
    const contactSecret = this.config.get<string>('WECOM_CONTACT_SECRET')
    if (appSecret) return [appSecret]
    return [appSecret, contactSecret].filter((secret, index, items): secret is string =>
      Boolean(secret && items.indexOf(secret) === index),
    )
  }

  private async fetchUsersWithSecret(
    secret: string,
    options: { departmentId?: number; fetchChild?: boolean },
    keyword: string,
  ) {
    const accessToken = await this.getAccessToken(secret)
    const url = new URL('https://qyapi.weixin.qq.com/cgi-bin/user/list')
    url.searchParams.set('access_token', accessToken)
    url.searchParams.set('department_id', String(options.departmentId ?? 1))
    url.searchParams.set('fetch_child', options.fetchChild === false ? '0' : '1')

    const response = await this.requestJson<WecomUserListResponse>(url.toString())
    this.assertWecomOk(response, '获取企业微信通讯录失败')

    const users = (response.userlist ?? []).map<WecomUser>((user) => ({
      userId: user.userid,
      name: user.name,
      departmentId: user.department?.[0],
      departmentName: user.department?.length ? `部门 ${user.department[0]}` : '',
      position: user.position,
      avatar: user.avatar,
      source: 'wecom',
    }))

    return {
      source: 'wecom' as const,
      configured: true,
      users: this.filterUsers(users, keyword),
    }
  }

  private contactSecret() {
    return this.config.get<string>('WECOM_CONTACT_SECRET') || this.config.get<string>('WECOM_CORP_SECRET')
  }

  private async fetchOauthUserDetail(accessToken: string, userTicket: string): Promise<WecomUser> {
    const url = new URL('https://qyapi.weixin.qq.com/cgi-bin/auth/getuserdetail')
    url.searchParams.set('access_token', accessToken)

    const response = await this.requestJson<WecomUserDetailResponse>(url.toString(), {
      method: 'POST',
      body: JSON.stringify({ user_ticket: userTicket }),
      headers: { 'Content-Type': 'application/json' },
    })
    this.assertWecomOk(response, '获取企业微信员工详情失败')
    return this.toWecomUser(response)
  }

  private async fetchUserById(accessToken: string, userId: string): Promise<WecomUser> {
    const url = new URL('https://qyapi.weixin.qq.com/cgi-bin/user/get')
    url.searchParams.set('access_token', accessToken)
    url.searchParams.set('userid', userId)

    const response = await this.requestJson<WecomUserDetailResponse>(url.toString())
    this.assertWecomOk(response, '获取企业微信成员信息失败')
    return this.toWecomUser({ ...response, userid: response.userid || userId })
  }

  private toWecomUser(user: WecomUserDetailResponse): WecomUser {
    const userId = user.userid ?? user.name ?? ''
    return {
      userId,
      name: user.name || userId,
      departmentId: user.department?.[0],
      departmentName: user.department?.length ? `部门 ${user.department[0]}` : '',
      mobile: user.mobile,
      avatar: user.avatar,
      position: user.position,
      source: 'wecom',
    }
  }

  private filterUsers(users: WecomUser[], keyword: string) {
    if (!keyword) return users
    return users.filter((user) =>
      `${user.name}${user.userId}${user.departmentName ?? ''}${user.position ?? ''}`.toLowerCase().includes(keyword),
    )
  }

  private async getAccessToken(secret: string) {
    const corpId = this.config.get<string>('WECOM_CORP_ID')
    const cacheKey = `access-token:${secret}`
    const cached = this.tokenCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) return cached.value

    const url = new URL('https://qyapi.weixin.qq.com/cgi-bin/gettoken')
    url.searchParams.set('corpid', corpId ?? '')
    url.searchParams.set('corpsecret', secret)

    const response = await this.requestJson<WecomTokenResponse>(url.toString())
    this.assertWecomOk(response, '获取企业微信 access_token 失败')
    if (!response.access_token) throw new Error('企业微信未返回 access_token')

    this.tokenCache.set(cacheKey, {
      value: response.access_token,
      expiresAt: Date.now() + Math.max((response.expires_in ?? 7200) - 300, 60) * 1000,
    })
    return response.access_token
  }

  private async getTicket(secret: string, type: 'jsapi' | 'agent_config') {
    const accessToken = await this.getAccessToken(secret)
    const cacheKey = `ticket:${type}:${secret}`
    const cached = this.ticketCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) return cached.value

    const url =
      type === 'jsapi'
        ? new URL('https://qyapi.weixin.qq.com/cgi-bin/get_jsapi_ticket')
        : new URL('https://qyapi.weixin.qq.com/cgi-bin/ticket/get')
    url.searchParams.set('access_token', accessToken)
    if (type === 'agent_config') url.searchParams.set('type', 'agent_config')

    const response = await this.requestJson<WecomTicketResponse>(url.toString())
    this.assertWecomOk(response, '获取企业微信 JS-SDK ticket 失败')
    if (!response.ticket) throw new Error('企业微信未返回 JS-SDK ticket')

    this.ticketCache.set(cacheKey, {
      value: response.ticket,
      expiresAt: Date.now() + Math.max((response.expires_in ?? 7200) - 300, 60) * 1000,
    })
    return response.ticket
  }

  private signTicket(ticket: string, nonceStr: string, timestamp: number, url: string) {
    return createHash('sha1')
      .update(`jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`)
      .digest('hex')
  }

  private async requestJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init)
    const text = await response.text()
    const data = text ? JSON.parse(text) : {}
    if (!response.ok) throw new Error(`企业微信接口请求失败：${response.status}`)
    return data as T
  }

  private assertWecomOk(response: { errcode: number; errmsg: string }, fallback: string) {
    if (response.errcode !== 0) {
      throw new Error(`${fallback}：${response.errmsg || response.errcode}`)
    }
  }
}
