import ProfileForm from "@/components/ProfileForm";

export default function EmployeeProfilePage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Update your name and password</p>
      </div>
      <ProfileForm />
    </div>
  );
}
