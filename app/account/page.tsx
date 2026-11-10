"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import useAuthStore from "@/store/authStore";
import useRequireAuth from "@/hooks/useRequireAuth";
import {
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  deactivateMyAccount,
} from "@/services/userService";

type PageMode = "overview" | "edit" | "password";

const quickLinks = [
  {
    title: "My Orders",
    description: "Track, manage and review your purchases",
    href: "/account/orders",
    Icon: ShoppingBagOutlinedIcon,
  },
  {
    title: "Saved Addresses",
    description: "Manage delivery addresses and defaults",
    href: "/account/addresses",
    Icon: LocationOnOutlinedIcon,
  },
  {
    title: "My Wishlist",
    description: "Products you have saved for later",
    href: "/wishlist",
    Icon: FavoriteBorderIcon,
  },
];

export default function AccountPage() {
  const router = useRouter();
  const { checking, authed } = useRequireAuth("/account");
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [mode, setMode] = useState<PageMode>("overview");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  });
  const [passwordFields, setPasswordFields] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const fullName = useMemo(
    () => [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim(),
    [profile.firstName, profile.lastName],
  );
  const initials = useMemo(
    () => [profile.firstName, profile.lastName]
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || "H",
    [profile.firstName, profile.lastName],
  );

  const loadProfile = useCallback(async (signal?: AbortSignal) => {
    setLoadingProfile(true);
    try {
      const response = await getMyProfile(signal);
      if (signal?.aborted) return;

      if (response.ok && response.data) {
        const nextProfile = {
          firstName: response.data.firstName ?? "",
          lastName: response.data.lastName ?? "",
          email: response.data.email ?? "",
          phone: response.data.phone ?? "",
        };
        setProfile(nextProfile);
        setPageError(null);
        useAuthStore.setState({
          user: {
            id: response.data.id,
            firstName: nextProfile.firstName,
            lastName: nextProfile.lastName,
            email: nextProfile.email,
            phone: nextProfile.phone,
          },
        });
      } else {
        setPageError("We couldn't load your profile. Please try again.");
      }
    } catch {
      if (!signal?.aborted) {
        setPageError("We couldn't load your profile. Check your connection and retry.");
      }
    } finally {
      if (!signal?.aborted) setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    void loadProfile(controller.signal);
    return () => controller.abort();
  }, [token, loadProfile]);

  const handleProfileSubmit = async () => {
    if (savingProfile) return;

    const firstName = profile.firstName.trim();
    const lastName = profile.lastName.trim();
    const phone = profile.phone.trim();

    if (!firstName || !lastName) {
      setPageError("Please enter your first and last name.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setPageError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    setSavingProfile(true);
    setPageError(null);
    setProfileMessage(null);

    try {
      const response = await updateMyProfile({ firstName, lastName, phone });
      if (response.ok && response.data) {
        const nextProfile = {
          firstName: response.data.firstName ?? firstName,
          lastName: response.data.lastName ?? lastName,
          email: response.data.email ?? profile.email,
          phone: response.data.phone ?? phone,
        };
        setProfile(nextProfile);
        useAuthStore.setState({
          user: {
            id: response.data.id,
            firstName: nextProfile.firstName,
            lastName: nextProfile.lastName,
            email: nextProfile.email,
            phone: nextProfile.phone,
          },
        });
        setProfileMessage("Your profile has been updated.");
        setMode("overview");
      } else {
        setPageError("Profile update failed. Please check your details and retry.");
      }
    } catch {
      setPageError("Profile update failed because of a network or server error. Please retry.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (changingPassword) return;

    const { currentPassword, newPassword, confirmPassword } = passwordFields;
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPageError("Complete all password fields before continuing.");
      return;
    }
    if (newPassword.length < 8) {
      setPageError("Your new password must contain at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPageError("The new password and confirmation do not match.");
      return;
    }

    setChangingPassword(true);
    setPageError(null);
    setPasswordMessage(null);
    try {
      const response = await changeMyPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (response.ok) {
        setPasswordFields({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setPasswordMessage("Password changed successfully.");
        setMode("overview");
      } else {
        setPageError("Password change failed. Verify your current password and try again.");
      }
    } catch {
      setPageError("Password change failed because of a network or server error. Please retry.");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeactivate = async () => {
    if (deactivating) return;

    setDeactivating(true);
    setPageError(null);
    try {
      const response = await deactivateMyAccount();
      if (response.ok) {
        logout();
        router.replace("/login");
        return;
      }
      setPageError("We couldn't deactivate your account. Please try again.");
    } catch {
      setPageError("Account deactivation failed because of a network or server error. Please retry.");
    } finally {
      setDeactivating(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  const startEdit = () => {
    setPageError(null);
    setProfileMessage(null);
    setMode("edit");
  };

  const startPasswordChange = () => {
    setPageError(null);
    setPasswordMessage(null);
    setMode("password");
  };

  return (
    <>
      <Header />
      <Box
        component="main"
        sx={{
          minHeight: "70vh",
          py: { xs: 3, md: 5 },
          background: "linear-gradient(180deg, #FFF7F0 0px, #FAFAFA 300px)",
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={0.75} sx={{ mb: 3.5 }}>
            <Typography
              variant="overline"
              sx={{ color: "primary.main", fontWeight: 800, letterSpacing: 1.4 }}
            >
              HAVLOOK ACCOUNT
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, letterSpacing: "-0.035em", fontSize: { xs: "1.8rem", sm: "2.25rem" } }}
            >
              My Account
            </Typography>
            <Typography color="text.secondary">
              Your personal details, orders and account preferences — all in one place.
            </Typography>
          </Stack>

          {checking || !authed ? (
            <Card sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                <Skeleton variant="rounded" height={116} />
                <Skeleton sx={{ mt: 3 }} height={54} />
                <Skeleton sx={{ mt: 1 }} height={54} />
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3} alignItems="flex-start">
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack spacing={2.5}>
                  <Card
                    sx={{
                      borderRadius: 4,
                      overflow: "hidden",
                      border: "1px solid",
                      borderColor: "divider",
                      boxShadow: "0 12px 36px rgba(38, 31, 24, 0.06)",
                    }}
                  >
                    <Box sx={{ height: 88, bgcolor: "primary.main", position: "relative" }}>
                      <Box sx={{
                        position: "absolute", width: 180, height: 180, borderRadius: "50%",
                        border: "28px solid rgba(255,255,255,0.12)", right: -40, top: -95,
                      }} />
                    </Box>
                    <CardContent sx={{ px: 3, pb: 3, mt: -5, position: "relative" }}>
                      <Avatar
                        sx={{
                          width: 76, height: 76, mb: 1.75, bgcolor: "#FFF1E6",
                          color: "primary.dark", border: "4px solid #fff",
                          fontSize: "1.35rem", fontWeight: 800,
                        }}
                      >
                        {loadingProfile ? "…" : initials}
                      </Avatar>
                      {loadingProfile ? (
                        <>
                          <Skeleton width="65%" height={32} />
                          <Skeleton width="85%" />
                        </>
                      ) : (
                        <>
                          <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            {fullName || "HavLook Customer"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, overflowWrap: "anywhere" }}>
                            {profile.email || "Email not added"}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
                            <Chip
                              size="small"
                              icon={<SecurityOutlinedIcon />}
                              label="Account active"
                              color="success"
                              variant="outlined"
                            />
                          </Stack>
                        </>
                      )}
                      <Divider sx={{ my: 2.5 }} />
                      <Stack spacing={1}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<EditOutlinedIcon />}
                          onClick={startEdit}
                          sx={{ justifyContent: "flex-start", py: 1.15, borderRadius: 2.5, boxShadow: "none" }}
                        >
                          Edit personal details
                        </Button>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<LockOutlinedIcon />}
                          onClick={startPasswordChange}
                          sx={{ justifyContent: "flex-start", py: 1.1, borderRadius: 2.5 }}
                        >
                          Change password
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card sx={{ borderRadius: 4, border: "1px solid", borderColor: "divider", boxShadow: "none" }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                        ACCOUNT SHORTCUTS
                      </Typography>
                      <Stack spacing={0.5}>
                        {quickLinks.map(({ title, description, href, Icon }) => (
                          <Button
                            key={href}
                            component={Link}
                            href={href}
                            color="inherit"
                            endIcon={<ArrowForwardIosRoundedIcon sx={{ fontSize: "0.8rem !important", color: "text.disabled" }} />}
                            sx={{
                              justifyContent: "flex-start", textAlign: "left", py: 1.3, px: 1,
                              borderRadius: 2, gap: 1.2, "&:hover": { bgcolor: "action.hover" },
                            }}
                          >
                            <Box sx={{
                              width: 40, height: 40, display: "grid", placeItems: "center",
                              borderRadius: 2, bgcolor: "#FFF1E6", color: "primary.main", flexShrink: 0,
                            }}>
                              <Icon />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 750 }}>{title}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: "block", whiteSpace: "normal" }}>
                                {description}
                              </Typography>
                            </Box>
                          </Button>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>

                  <Button
                    color="error"
                    variant="text"
                    startIcon={<LogoutRoundedIcon />}
                    onClick={handleLogout}
                    sx={{ alignSelf: "flex-start", fontWeight: 700 }}
                  >
                    Sign out of HavLook
                  </Button>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 8 }}>
                <Stack spacing={2.5}>
                  {pageError && <Alert severity="error" onClose={() => setPageError(null)}>{pageError}</Alert>}
                  {profileMessage && <Alert severity="success" onClose={() => setProfileMessage(null)}>{profileMessage}</Alert>}
                  {passwordMessage && <Alert severity="success" onClose={() => setPasswordMessage(null)}>{passwordMessage}</Alert>}

                  <Card sx={{ borderRadius: 4, border: "1px solid", borderColor: "divider", boxShadow: "0 12px 36px rgba(38, 31, 24, 0.04)" }}>
                    <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 2.5 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            {mode === "edit" ? "Edit personal details" : mode === "password" ? "Password & security" : "Personal information"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                            {mode === "edit"
                              ? "Keep your contact details up to date."
                              : mode === "password"
                                ? "Choose a strong password that you don't use elsewhere."
                                : "Your details help us keep your orders and deliveries connected to you."}
                          </Typography>
                        </Box>
                        {mode === "overview" && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditOutlinedIcon />}
                            onClick={startEdit}
                            sx={{ flexShrink: 0, borderRadius: 2 }}
                          >
                            Edit
                          </Button>
                        )}
                      </Stack>

                      {loadingProfile && mode !== "password" ? (
                        <Stack spacing={1.5}>
                          <Skeleton height={54} />
                          <Skeleton height={54} />
                          <Skeleton height={54} />
                        </Stack>
                      ) : mode === "edit" ? (
                        <Stack spacing={2}>
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField fullWidth label="First name" value={profile.firstName} onChange={(event) => setProfile((current) => ({ ...current, firstName: event.target.value }))} autoComplete="given-name" />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField fullWidth label="Last name" value={profile.lastName} onChange={(event) => setProfile((current) => ({ ...current, lastName: event.target.value }))} autoComplete="family-name" />
                            </Grid>
                          </Grid>
                          <TextField fullWidth label="Email address" value={profile.email} disabled helperText="Email address cannot be changed here." />
                          <TextField
                            fullWidth
                            label="Mobile number"
                            value={profile.phone}
                            onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value.replace(/\D/g, "").slice(0, 10) }))}
                            inputProps={{ inputMode: "numeric", maxLength: 10 }}
                            autoComplete="tel"
                          />
                          <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={1.5} justifyContent="flex-end">
                            <Button variant="text" color="inherit" onClick={() => { setPageError(null); setMode("overview"); }}>Cancel</Button>
                            <Button variant="contained" onClick={() => void handleProfileSubmit()} disabled={savingProfile} sx={{ px: 3, borderRadius: 2, boxShadow: "none" }}>
                              {savingProfile ? "Saving…" : "Save changes"}
                            </Button>
                          </Stack>
                        </Stack>
                      ) : mode === "password" ? (
                        <Stack spacing={2}>
                          <TextField fullWidth label="Current password" type="password" autoComplete="current-password" value={passwordFields.currentPassword} onChange={(event) => setPasswordFields((current) => ({ ...current, currentPassword: event.target.value }))} />
                          <TextField fullWidth label="New password" type="password" autoComplete="new-password" value={passwordFields.newPassword} onChange={(event) => setPasswordFields((current) => ({ ...current, newPassword: event.target.value }))} helperText="Use at least 8 characters." />
                          <TextField fullWidth label="Confirm new password" type="password" autoComplete="new-password" value={passwordFields.confirmPassword} onChange={(event) => setPasswordFields((current) => ({ ...current, confirmPassword: event.target.value }))} />
                          <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={1.5} justifyContent="flex-end">
                            <Button variant="text" color="inherit" onClick={() => { setPageError(null); setMode("overview"); }}>Cancel</Button>
                            <Button variant="contained" onClick={() => void handlePasswordSubmit()} disabled={changingPassword} sx={{ px: 3, borderRadius: 2, boxShadow: "none" }}>
                              {changingPassword ? "Updating…" : "Update password"}
                            </Button>
                          </Stack>
                        </Stack>
                      ) : (
                        <Grid container spacing={2.5}>
                          {[
                            { label: "First name", value: profile.firstName || "Not provided" },
                            { label: "Last name", value: profile.lastName || "Not provided" },
                            { label: "Email address", value: profile.email || "Not provided" },
                            { label: "Mobile number", value: profile.phone || "Not provided" },
                          ].map((item) => (
                            <Grid key={item.label} size={{ xs: 12, sm: 6 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.4 }}>
                                {item.label.toUpperCase()}
                              </Typography>
                              <Typography variant="body1" sx={{ mt: 0.45, fontWeight: 650, overflowWrap: "anywhere" }}>
                                {item.value}
                              </Typography>
                            </Grid>
                          ))}
                        </Grid>
                      )}
                    </CardContent>
                  </Card>

                  <Card sx={{ borderRadius: 4, border: "1px solid", borderColor: "divider", boxShadow: "none" }}>
                    <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                      <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <Box sx={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 2, bgcolor: "#FFF1E6", color: "primary.main", flexShrink: 0 }}>
                          <SecurityOutlinedIcon />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Your account, protected</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                            Never share your password or one-time verification codes with anyone, including someone claiming to be from HavLook.
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card sx={{ borderRadius: 4, border: "1px solid", borderColor: "error.light", boxShadow: "none" }}>
                    <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between">
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "error.main" }}>Deactivate account</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                            This disables your account. You may lose access to HavLook services.
                          </Typography>
                        </Box>
                        <Button
                          color="error"
                          variant="outlined"
                          startIcon={<WarningAmberRoundedIcon />}
                          onClick={() => setShowDeactivateConfirm((visible) => !visible)}
                          sx={{ flexShrink: 0, borderRadius: 2 }}
                        >
                          {showDeactivateConfirm ? "Close" : "Deactivate"}
                        </Button>
                      </Stack>
                      {showDeactivateConfirm && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            Are you sure? This action will deactivate your account.
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                            <Button
                              color="inherit"
                              size="small"
                              disabled={deactivating}
                              onClick={() => setShowDeactivateConfirm(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              color="error"
                              size="small"
                              variant="contained"
                              disabled={deactivating}
                              onClick={() => void handleDeactivate()}
                            >
                              {deactivating ? "Deactivating…" : "Yes, deactivate"}
                            </Button>
                          </Stack>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Stack>
              </Grid>
            </Grid>
          )}
        </Container>
      </Box>
      <Footer />
    </>
  );
}
