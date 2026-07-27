package com.zetlan.smartretailmanagement.dto;

public class EmployeeDTO {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private Boolean isActive;
    private Long roleId;
    private String roleName;

    // Notice we do NOT include the password here. This prevents accidentally sending it to the frontend.

    public EmployeeDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean active) { isActive = active; }
    public Long getRoleId() { return roleId; }
    public void setRoleId(Long roleId) { this.roleId = roleId; }
    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }
}