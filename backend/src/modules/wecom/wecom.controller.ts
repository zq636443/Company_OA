import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { WecomService } from './wecom.service'

@Controller('wecom')
export class WecomController {
  constructor(private readonly wecom: WecomService) {}

  @Get('status')
  status() {
    return this.wecom.status()
  }

  @Get('js-config')
  jsConfig(@Query('url') url: string) {
    return this.wecom.jsConfig(url)
  }

  @Get('oauth-url')
  oauthUrl(
    @Query('redirectUri') redirectUri: string,
    @Query('state') state?: string,
    @Query('scope') scope?: 'snsapi_base' | 'snsapi_privateinfo',
  ) {
    return this.wecom.oauthUrl(redirectUri, state, scope)
  }

  @Post('oauth-login')
  oauthLogin(@Body('code') code: string) {
    return this.wecom.oauthLogin(code)
  }

  @Get('users')
  users(
    @Query('keyword') keyword?: string,
    @Query('departmentId') departmentId?: string,
    @Query('fetchChild') fetchChild?: string,
  ) {
    return this.wecom.users({
      keyword,
      departmentId: departmentId ? Number(departmentId) : undefined,
      fetchChild: fetchChild === undefined ? undefined : fetchChild === 'true',
    })
  }
}
