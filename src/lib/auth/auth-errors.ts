export class AuthRequiredError extends Error {
  status = 401;
  code = "AUTH_REQUIRED";

  constructor(message = "请先登录") {
    super(message);
    this.name = "AuthRequiredError";
  }
}

export class AuthNotAllowedError extends Error {
  status = 403;
  code = "AUTH_NOT_ALLOWED";

  constructor(message = "该邮箱不在访问白名单中") {
    super(message);
    this.name = "AuthNotAllowedError";
  }
}

export class ProfileSyncError extends Error {
  status = 500;
  code = "PROFILE_SYNC_FAILED";

  constructor(message = "用户档案同步失败") {
    super(message);
    this.name = "ProfileSyncError";
  }
}
